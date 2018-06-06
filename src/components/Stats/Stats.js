import React, { Component } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Form, Table, Icon, Divider, Select, Input, Button, message, Popconfirm, Tooltip,  DatePicker, Modal } from 'antd'
import Helpers, { t, pick, ObjectClear, TreeSelect, queryParams } from '../../common/Helpers'
import api from '../../common/Api'
import axios from 'axios'
import moment from 'moment'
import locale from 'antd/lib/date-picker/locale/ru_RU'
import qs from 'qs'
const Option = Select.Option
const { RangePicker } = DatePicker

const initialFilter = { group: 'action_day' }

// parse filter name to filter value
const parseQueryFiltersValues = (name) => {
  const params = queryParams()

  let key
  let value

  switch(name) {
    case 'country_id':
    case 'landing_id':
    case 'platform_id':
    case 'offer_id':
    case 'device_type_id':
      key = `q[${name}][in]`
      value = params[key] && params[key].split(',')
      break;
    case 'date':
      key =  `q[${name}][between]`
      const _value = params[key] && params[key].split(',')
      if(_value) value = [ moment.unix(_value[0]), moment.unix(_value[1]) ]
      break;
    case 'sub_id_1':
    case 'sub_id_2':
    case 'sub_id_3':
      key = `q[${name}][equal]`
      value = params[key]
      break;
    default:
      value = params[name]
  }
  return value
}

class CustomTreeSelect extends Component {

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

    /* window.addEventListener('CHANGE_LANG', () => {
      this.setState({ data: [], isLoading: false }, this._onClick)
    }, false) */
  }

  _onClick = () => {
    const { filter } = this.props
    const { data, isLoading } = this.state
    if(isLoading || data.length > 0) return
    this.setState({ isLoading: true })
    api.get(`v1/statistics/filters?name=${filter}`)
    .then(response => {
      if(filter == 'devices') {
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
        {...this.props}
      />
    )
  }

}

class _Filter extends Component {

  constructor(props) {
    super(props)
    this.state = {
      filters: queryParams()
    }
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      values = ObjectClear(values)
      this.props.onSubmit(values)
    })
  }

  validator = (name, label, input) => {
    const { getFieldDecorator } = this.props.form
    const options = { }

    const _value = parseQueryFiltersValues(name) || initialFilter[name]
    if(_value) options.initialValue = _value

    return (
      <Form.Item className={`filter__field-${name}`}>
        <h4>{label}</h4>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  render() {
    return (
      <div className="filter filter__stats">
        <Form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-xs-12 col-md-2">
              {this.validator('group', t('field.group'), (
                <Select size="large">
                  <Select.Option key="action_hour">{t('action_hour')}</Select.Option>
                  <Select.Option key="action_day">{t('action_day')}</Select.Option>
                  <Select.Option key="action_week">{t('action_week')}</Select.Option>
                  <Select.Option key="action_month">{t('action_month')}</Select.Option>
                  <Select.Option key="offer_id">{t('field.offer')}</Select.Option>
                  <Select.Option key="country_id">{t('field.country')}</Select.Option>
                  <Select.Option key="device_type_id">{t('field.device')}</Select.Option>
                  <Select.Option key="platform_id">{t('field.platform')}</Select.Option>
                  <Select.Option key="stream_id">{t('field.stream')}</Select.Option>
                  <Select.Option key="landing_id">{t('field.landing')}</Select.Option>
                </Select>
              ))}
              <div className="filter__separator"></div>
              {this.validator('date', t('field.date'),<RangePicker size="large" format="DD.MM.YYYY" /> )}
            </div>
            <div className="col-md-2">
              {this.validator('offer_id', t('field.offer'), <CustomTreeSelect filter="offers" /> )}
              <div className="filter__separator"></div>
              {this.validator('landing_id', t('field.landings'), <CustomTreeSelect filter="landings" /> )}
            </div>
            <div className="col-md-2">
              {this.validator('platform_id', t('field.platforms'), <CustomTreeSelect filter="platforms" /> )}
              <div className="filter__separator"></div>
              {this.validator('stream_id', t('field.streams'), <CustomTreeSelect filter="streams" /> )}
            </div>
            <div className="col-md-2">
              {this.validator('sub_id_1', 'sub_id_1', <Input placeholder="sub_id_1" size="large" /> )}
              <div className="filter__separator"></div>
              {this.validator('country_id', t('field.countries'), <CustomTreeSelect filter="countries" /> )}
            </div>
            <div className="col-md-2">
              {this.validator('sub_id_2', 'sub_id_2', <Input placeholder="sub_id_2" size="large" /> )}
              <div className="filter__separator"></div>
              {this.validator('device_type_id', t('field.devices'), <CustomTreeSelect filter="devices" /> )}
            </div>
            <div className="col-md-2">
              {this.validator('sub_id_3', 'sub1', <Input placeholder="sub_id_3" size="large" /> )}
              <div className="filter__separator"></div>
              <div>
                <Form.Item>
                  <h4>&nbsp;</h4>
                  <Button type="primary" htmlType="submit" size="large">{t('button.show')}</Button>
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class Stats extends Component {

  constructor(props) {
    super(props)
    const tmp = queryParams()
    this.state = {
      data: [],
      filters: Object.keys(tmp).length && tmp || initialFilter,
      pagination: {
        hideOnSinglePage: true,
      },
      sorter: {},
    }
  }

  handleTableChange = (pagination, filters, sorter) => {
    const field = this.state.filters.group
    this.setState({
      sorter: {
        order: sorter.order,
        field: field
      }
    }, () => {
      let sort = (sorter.order == 'ascend') ? field : `-${field}`
      this.fetch(pagination.current, { sort: sort })
    })
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.stats')
    this.fetch()
  }

  fetch = (page = 1, opts = {}) => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })
    if(!opts.sort) opts.sort = `-${filters.group}`

    // 24 perpage on action_hour
    pagination.pageSize = 11
    if(filters.group == 'action_hour') pagination.pageSize = 25

    const request = api.get('/v1/statistics', {
      params: {
        page: page,
        ...filters,
        ...opts,
        'per-page': pagination.pageSize - 1,
      }
    })

    if(filters.expand) delete filters.expand
    const total = api.get('/v1/statistics', {
      params: {
        ...filters,
        ...opts,
        group: 'all'

      }
    })

    axios.all([request, total])
    .then(axios.spread((response, total) => {
      const data = response.data
      data.push(total.data[0])
      this.setState({
        isLoading: false,
        data: data,
        pagination: {
          ...pagination,
          total: parseInt(response.headers['x-pagination-total-count'])
        }
      })
    }))
  }

  renderFirstColumn = () => {
    const { data, filters, devices } = this.state
    const group = filters['group']
    const title = group.replace('_id', '')
    return {
      title: t(`field.${title}`),
      key: 'group',
      sorter: true,
      sort_field: group,
      render: (text, row, i) => {
        if(data.length - 1 == i) return t('field.total')
        switch(group) {
          case 'offer_id':
            text = row.offer && <span><a href={`/offers/${row.offer.id}`} target="_blank">{row.offer.name}</a></span> || '-'
            break;
          case 'country_id':
            text = row.country && <span>{row.country.name}</span>
            break;
          case 'device_type_id':
            text = <span>{row.device}</span> || '-'
            break;
          case 'platform_id':
            text = row.platform && <span>{row.platform.name}</span> || '-'
            break;
          case 'landing_id':
            text = '-'
            break;
          case 'stream_id':
            text = row.stream && <span>{row.stream.name}</span> || '-'
            break;
          case 'action_day':
            text = row[group] && moment.unix(row[group]).format('DD.MM.YY')
            break;
          case 'action_month':
            text = row[group] && moment.unix(row[group]).format('MMMM YYYY')
            break;
          case 'action_week':
            const start = moment.unix(row[group])
            const end = moment.unix(row[group]).add(7, 'days')
            text = `${start.format('DD.MM.YY')} - ${end.format('DD.MM.YY')} `
            break;
          case 'action_hour':
            const hour = row[group] < 10 ? `0${row[group]}` : row[group]
            text = `${hour}:00`
        }
        return text
      }
    }
  }

  onFilter = (values) => {
    const filters = {}
    const columns = this.state.columns
    const keys = Object.keys(values)
    if(keys) {
      keys.forEach(key => {
        const val = values[key]
        switch (key) {
          case 'country_id':
          case 'landing_id':
          case 'platform_id':
          case 'offer_id':
          case 'device_type_id':
          case 'stream_id':
            filters[`q[${key}][in]`] = val.join(',')
            break;
          case 'group':
            filters[`group`] = val
            /* filters['expand'] = (val == 'device_type_id') ? 'device' : val.replace('_id', '')
            if(['landing_id', 'stream_id'].includes(val)) {
              filters['expand'] = filters['expand'] + ',' + filters['expand'] + '.offer'
            } */
            filters['expand'] = val.replace('_id', '')
            if(val == 'device_type_id') filters['expand'] = 'device'
            break;
          case 'date':
            const start = val[0] && val[0].startOf('day').utcOffset(0).unix()
            const end = val[1] && val[1].endOf('day').utcOffset(0).unix()
            if(start && end) filters[`q[${key}][between]`] = `${start},${end}`
            break;
          default:
            filters[`q[${key}][equal]`] = val
        }
      })
    }
    this.setState({
      filters: filters,
      columns: columns,
    }, () => {
      const params = qs.stringify(filters, { encode: false })
      window.history.pushState('', '', `?${params}`);
      this.fetch()
    })
  }

  render() {
    const { data, pagination, isLoading } = this.state
    const columns = [
      this.renderFirstColumn(),
      {
        title: t('field.hit_count'),
        dataIndex: 'hit_count',
        sorter: true
      }, {
        title: t('field.click_count'),
        dataIndex: 'click_count',
        sorter: true
      }, {
        title: t('field.reg_count'),
        dataIndex: 'reg_count',
        sorter: true
      }, {
        title: (<div className="stats__table-th-title">First dep<div>{t('field.count')} / {t('field.sum')}</div></div>),
        dataIndex: 'first_dep_count',
        render: (text, { first_dep_count, first_dep_sum }) => `${first_dep_count} / ${first_dep_sum}`,
        sorter: true,
      }, {
        title: (<div className="stats__table-th-title">Dep<div>{t('field.count')} / {t('field.sum')}</div></div>),
        dataIndex: 'dep_count',
        render: (text, { dep_count, dep_sum }) => `${dep_count} / ${dep_sum}`,
        sorter: true,
      }, {
        title: t('field.player_lose'),
        dataIndex: 'player_lose_sum',
        sorter: true,
      }, {
        title: t('field.player_out'),
        dataIndex: 'player_out_sum',
        sorter: true,
      }, {
        title: t('field.player_promo'),
        dataIndex: 'player_promo_sum',
        sorter: true,
      }, {
        title: 'Net gaming',
        dataIndex: 'net_gaming',
        sorter: true,
      }, {
        title: 'CPA',
        dataIndex: 'cpa_confirmed_income_sum',
        sorter: true,
      }, {
        title: 'Revshare',
        dataIndex: 'revshare_income',
        sorter: true
      }
    ]
    return (
      <div>
        <Filter onSubmit={this.onFilter} />
        <Table
          ref="tbl"
          className="stats__table"
          columns={columns}
          rowKey={(item, i) => i}
          dataSource={data}
          pagination={pagination}
          loading={isLoading}
          onChange={this.handleTableChange} />
      </div>
    )
  }
}

export default Stats
