import api from './Api'
import React, { Component } from 'react'
import { Icon, Spin, message } from 'antd'
import qs from 'qs'
import moment from 'moment'
import * as Cookies from 'js-cookie'
import RcTreeSelect, { TreeNode } from 'rc-tree-select'
import store from '../reducers'
import * as Feather from 'react-feather'

const Helpers = {

  time_offset: () => 180,
  renderCurrency: () => '$',

  errorHandler: (e) => {
    if(e && e.response && e.response.data && Array.isArray(e.response.data)) {
      e.response.data.forEach(error => {
        message.error(error.message)
      })
    } else {
      message.error('Произошла ошибка')
    }
  },

  getPopupContainer: () => {
    return document.getElementById('content')
  },

  checkUserData: () => {
    const user_id = Cookies.get('user_id')
    api.get(`/v1/user-data/${user_id}?expand=user,personalManager`)
    .then((response) => {
      const balance = response.data && response.data.balance || 0.00
      const hold = response.data && response.data.hold || 0
      const { personalManager } = response.data
      window.store.dispatch({
        type: "USER_SET_DATA",
        params: {
          user_id: user_id,
          balance: balance,
          hold: hold,
          email: response.data.user.email,
          name: response.data.name,
          default_revshare_percent: response.data.default_revshare_percent,
          avatar_image: response.data.avatar_image || 'img/avatar.jpg',
          manager: {
            avatar: personalManager.avatar_image,
            name: personalManager.name,
            skype: personalManager.contacts.skype,
          }
        }
      })
    })
    .catch((e) => {
      api.post(`/v1/user-data`, qs.stringify({ ref_id: Cookies.get('ref_id') }))
      .then((response) => {
        Helpers.checkUserData()
      })
    })
  },

  checkTicketMessages: () => {
    const user_id = 1 // Cookies.get('user_id')

    api.get('/v1/ticket-messages', {
      params: {
        'q[status][equal]': 'unread',
        'q[user_id][not_equal]': user_id,
      }
    })
    .then((response) => {
      window.store.dispatch({
        type: "USER_SET_DATA",
        params: { unreadMessages: parseInt(response.headers['x-pagination-total-count']) }
      })
    })

  },

  checkUserPlatforms: () => {
    api.get(`/v1/platforms`, {
      params: {
        'per-page': 999,
        'sort': '-id'
      }
    })
    .then(response => {
      window.store.dispatch({
        type: "USER_SET_DATA",
        params: {
          platforms: response.data
        }
      })
    })
  },

  checkUserWallets: () => {
    api.get(`/v1/wallets`, {
      params: {
        'per-page': 999,
        'sort': '-id'
      }
    })
    .then(response => {
      window.store.dispatch({
        type: "USER_SET_DATA",
        params: {
          wallets: response.data
        }
      })
    })
  },

  // установка заголовка в шапке
  setTitle: (title) => {
    window.store.dispatch({
      type: "CONFIG_SET",
      params: {
        title: title
      }
    })
  },

  emptyText: () => <div className="notfound"><Feather.Info /> {t('emptyText')}</div>,

  getCountries: () => {
    const { countries } = window.store.getState().config
    if(countries) return
    api.get(`v1/countries`)
    .then(response => {
      const countries = response.data.map(item => {
        return {
          title: item.name,
          value: item.id
        }
      })
      window.store.dispatch({ type: "CONFIG_SET", params: { countries: countries } })
    })
  },

  spinner: () => {
    const indicator = <Icon type="loading" style={{ fontSize: 24 }} spin />
    return (<div className="spinner"><Spin indicator={indicator} /></div>)
  },

  // show overlay spinner
  isLoading: (show) => window.store.dispatch({ type: "TOGGLE_SPINNER", show: show }),

  renderStatus: (status, statuses) => {
    let color = ''
    switch (status) {
      case 'confirmed':
      case 'active':
        color = 'green';
        break;
      case 'moderate':
      case 'pending':
        color = 'orange';
        break;
      case 'rejected':
        color = 'red';
        break;
    }
    const text = statuses[status]
    return <span className={`c__${color}`}>{text || status}</span>
  }

}
export default Helpers

export const Events = {
  follow: (name, target) => {
    if(!window.EventsList) window.EventsList = {}
    window.EventsList[name] = true
    window.addEventListener(name, target)
  },
  unfollow: (name, target) => {
    if(window.EventsList && window.EventsList[name]) delete window.EventsList[name]
    window.removeEventListener(name, target)
  },
  list: () => window.EventsList && Object.keys(window.EventsList).map(key => key) || [],
  dispatch: (name) => window.dispatchEvent(new Event(name)),
}

export const disabledDate = (current) => current && current > moment().endOf('day')

// del
export const parseQueryFiltersValues = (name) => {
  const params = queryParams()

  let key
  let value

  switch(name) {
    case 'country_id':
    case 'device_type_id':
    case 'landing_id':
    case 'platform_id':
    case 'offer_id':
    case 'sub_id_1':
    case 'sub_id_2':
    case 'sub_id_3':
    case 'sub_id_4':
    case 'sub_id_5':
      key = `q[${name}][in]`
      value = params[key] && params[key].split(',')
      break;
    case 'date':
    case 'created_at':
      key =  `q[${name}][between]`
      const _value = params[key] && params[key].split(',')
      if(_value) value = [ moment.unix(_value[0]), moment.unix(_value[1]) ]
      break;
    case 'name':
      key = `q[${name}][like]`
      value = params[key]
      break;
    case 'group':
      key = name
      value = params[key]
      break;
    default:
      key = `q[${name}][equal]`
      value = params[key]
  }
  return value
}


// translator
export const t = (key) => {
  const { current, translations } = store.getState().lang
  return translations[current] && translations[current][key] || key
}

// get specifed keys from object (default:custom)
export const pick = (o, ...props) => Object.assign({}, ...props.map(prop => ({
  [prop.includes(':') ? prop.split(':')[1] : prop]: o[prop.includes(':') ? prop.split(':')[0] : prop]
 })))

// clean undefined from object/array
export const clean = (values) => {
  Object.keys(values).forEach(key => (values[key] === undefined || !values[key] || Array.isArray(values[key]) && values[key].length == 0) && delete values[key])
  return values
}

// delete
export const ObjectClear = (values) => {
  Object.keys(values).forEach(key => (values[key] === undefined || !values[key] || Array.isArray(values[key]) && values[key].length == 0) && delete values[key])
  return values
}

// filters helper
export const Filters = {

  parse: () => {
    const tmp = qs.parse(window.location.search.substr(1), {
      plainObjects: true,
      depth: -2,
      ignoreQueryPrefix: true,
      allowDots: true,
      parseArrays: false
    })

    if(tmp['q']) {
      const keys = Object.keys(tmp['q'])
      Object.keys(tmp['q']).forEach(key => {
        tmp[`q${key}`] = tmp['q'][key]
      })
      delete tmp['q']
    }

    return tmp
  },

  prepare: (values, custom = {}) => {
    const skip = ['group']
    const filters = {}
    const keys = Object.keys(values)
    if(!keys.length) return filters
    keys.forEach(key => {
      const val = values[key]
      const isArray = Array.isArray(val)
      if(!val || skip.includes(key) || isArray && !val.length) return
      if(isArray) {
        if(['created_at', 'date'].includes(key)) {
          const start = val[0] && val[0].startOf('day').unix()
          const end = val[1] && val[1].endOf('day').unix()
          if(start && end) filters[`q[${key}][between]`] = `${start},${end}`
        } else {
          filters[`q[${key}][in]`] = val.join(',')
        }
      } else {
        switch (key) {
          case (custom && Object.keys(custom).includes(key) && key):
            let value = val
            const type = custom[key]
            if(isArray && ['in', 'not_in', 'between', 'not_between', 'or'].includes(type)) value = val.join(',')
            filters[`q[${key}][${type}]`] = value
            break;
          case 'name':
          case 'url':
            filters[`q[${key}][like]`] = val
            break;
          default:
            filters[`q[${key}][equal]`] = val
        }
      }
    })
    return filters
  },

  value: (name, initialFilter = {}) => {
    const _params = Filters.parse()
    const params = Object.keys(_params).length && _params || initialFilter
    if(name == 'group') return params[name]
    let key, value, type
    const tmp = Object.keys(params)
    tmp.forEach(tmp_k => {
      key = tmp_k.includes(`q[${name}]`) && tmp_k
      if(!key) return
      value = params[key]
      type = key.split(`q[${name}]`)[1]
      if(type) {
        type = type.replace('[', '').replace(']', '')
        if(['in', 'not_in', 'between', 'not_between', 'or'].includes(type)) value = value.split(',')
        if(['created_at', 'date'].includes(name)) {
          if(type == 'between') {
            const start = value[0] && moment.unix(value[0])
            const end = value[1] && moment.unix(value[1])
            if(start && end) value = [start, end]
          } else if(type == 'equal') {
            value = moment.unix(value)
          }
        }
      }
    })
    return value
  },

  toUrl: (filters) => window.history.pushState('', '', `?` + qs.stringify(filters, { encode: false })),

}


export const queryParams = () => {
  const tmp = qs.parse(window.location.search.substr(1), {
    plainObjects: true,
    depth: -2,
    ignoreQueryPrefix: true,
    allowDots: true,
    parseArrays: false
  })

  if(tmp['q']) {
    const keys = Object.keys(tmp['q'])
    Object.keys(tmp['q']).forEach(key => {
      tmp[`q${key}`] = tmp['q'][key]
    })
    delete tmp['q']
  }

  return tmp
}

// custom tree-select
class _TreeSelect extends RcTreeSelect {
  renderTopControlNode() {
    const { value } = this.state
    const props =  this.props
    const { children, placeholder, choiceTransitionName, prefixCls, maxTagTextLength } = props

    let selectedValueNodes = [];

    if(value.length) {
      let content = null
      if(value.length == 1) {
        content = value[0].label
      } else if(value.length == 2) {
        content = `${value[0].label}, ${value[1].label}`
      } else if(value.length > 2 && value.length < children.length) {
        content = `${value.length} из ${children.length}`
      } else if(value.length == children.length) {
        content = `Все`
      }
      selectedValueNodes.push(<li className={`custom__select-tree-selected`} style={{ float: 'left' }} key="test">{content}</li>)
    }

    selectedValueNodes.push(
      <li className={`${prefixCls}-search ${prefixCls}-search--inline`} key="__input">
        {this.getInputElement()}
      </li>
    )

    const className = `${prefixCls}-selection__rendered`
    return (<ul className={className}>{selectedValueNodes}</ul>)
  }
}
export const TreeSelect = (props) => {
  const options = {
    allowClear: true,
    treeCheckable: (<span className={`ant-select-tree-checkbox-inner`} />),
    prefixCls: "ant-select",
    className: "ant-select-custom ant-select-lg",
    dropdownClassName: `ant-select-tree-dropdown`,
    ...props,
    //showSearch: false,
    //filterTreeNode: false,
  }
  delete options.values

  const values = props.values && props.values.map((item, i) => <TreeNode value={item.id && item.id.toString()} title={item.name} key={i} />) || null
  return <_TreeSelect {...options}>{values}</_TreeSelect>
}
export class TreeSelectRemote extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      isLoading: false,
    }
  }

  componentDidMount = () => {
    const { value } = this.props
    if(value) this._onClick()
  }

  _onClick = () => {
    const { filter, target } = this.props
    const { data, isLoading } = this.state
    if(isLoading || data.length > 0) return
    this.setState({ isLoading: true })

    const url = filter && `v1/statistics/filters?name=${filter}` || target
    api.get(url, {
      params: {
        'per-page': 999,
      }
    })
    .then(response => {
      if(!Array.isArray(response.data) && typeof response.data === 'object') {
        const tmp = Object.keys(response.data).map(key => {
          return { id: key, name: response.data[key] }
        })
        response.data = tmp
      }
      this.setState({ data: response.data, isLoading: false })
    })
    .catch(e => {
      this.setState({ isLoading: false })
    })
  }

  render() {
    const { data, isLoading } = this.state
    return (
      <TreeSelect
        onClick={this._onClick}
        values={data}
        notFoundContent={isLoading ? Helpers.spinner() : Helpers.emptyText()}
        placeholder={t('field.all')}
        dropdownMatchSelectWidth={false}
        searchPlaceholder="Поиск..."
        filterTreeNode={(input, option) => option.props.title.toLowerCase().indexOf(input.toLowerCase()) >= 0}
        {...this.props}
      />
    )
  }

}


export const flatten = (obj) => {
 var root = {};
 (function tree(obj, index){
   var suffix = toString.call(obj) == "[object Array]" ? "]" : "";
   for(var key in obj){
    if(!obj.hasOwnProperty(key))continue;
    root[index+key+suffix] = obj[key];
    if( toString.call(obj[key]) == "[object Array]" )tree(obj[key],index+key+suffix+"[");
    if( toString.call(obj[key]) == "[object Object]" )tree(obj[key],index+key+suffix+".");
   }
 })(obj,"");
 return root;
}
