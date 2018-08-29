import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import { Route, Redirect, Switch, NavLink, Link } from 'react-router-dom'
import Helpers, { t, pick, TreeSelectRemote } from '../../common/Helpers'
import api from '../../common/Api'
import * as Feather from 'react-feather'
import Consultant from '../Widgets/Consultant'
import StreamsForm from './Streams/Form'

class Streams extends Component {

  constructor(props) {
    super(props)
    this.state = {
      offer_id: props.match.params.id,
      data: [],
      isLoading: true,
      pagination: {
        hideOnSinglePage: true,
        current: 1,
      },
    }
  }

  componentDidMount = () => {
    this.fetch()
  }

  handlePageChange = (page) => {
    const { pagination } = this.state
    pagination.current = page
    this.setState({ pagination: pagination }, () => {
      this.fetch(page)
    })
  }

  fetch = (page = 1) => {
    api.get('/v1/streams', {
      headers: {
        'x-linkable': 'enabled',
      },
      params: {
        sort: '-id',
        page: page,
        expand: 'platform',
        'per-page': 999,
        'q[offer_id][equal]': this.state.offer_id,
      }
    })
    .then(response => {
      this.setState({
        isLoading: false,
        data: response.data,
        pagination: {
          ...this.state.pagination,
          total: parseInt(response.headers['x-pagination-total-count'])
        }
      })
    })
  }

  renderItems = () => {
    const { data, offer_id } = this.state
    return data.map(item => {
      const date = moment.unix(item.created_at).format('DD.MM.YYYY (HH:mm)')
      const link = item._links && item._links.landing && item._links.landing.href
      return (
        <div className="offers__item streams__item" key={item.id}>
          <div className="block">
            <div className="flex">
              <h3>{item.name}</h3>
              <div className="streams__item-date">{date}</div>
            </div>
          </div>
          <div className="block">
            <div className="flex">
              <div>
                <h4>{t('field.link')}</h4>
                <div>
                  <a href={link} target="_blank">{link}</a>
                </div>
              </div>
              <div>
                <h4>{t('field.platform')}</h4>
                <div>{item.platform && item.platform.name || '-'}</div>
              </div>
              <Link to={`/offers/${offer_id}/streams/${item.id}`} className="ant-btn ant-btn-primary">{t('button.edit')}</Link>
            </div>
          </div>
        </div>
      )
    })
  }

  render() {
    const { data, isLoading } = this.state
    const items = this.renderItems()
    return (
      <div>
        {items}
      </div>
    )
  }
}

const routes = [
  {
    name: 'field.streams',
    path: '/offers/:id',
    component: Streams,
    exact: true,
  },
  {
    name: 'streams.add',
    path: '/offers/:offer_id/streams/add',
    component: () => <StreamsForm />, //offer_id={data.id} landings={landings}
    exact: true,
  },
  {
    name: 'field.streams',
    path: '/offers/:offer_id/streams/:id',
    component: (params) => <StreamsForm {...params} />,
    exact: true
  },
]

class Offer extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: {
        id: props.match.params.id,
      },
      landings: [],
      actions: [],
      sources: [], // global sources
      isLoading: true,

      showTargeting: false,
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.offers')
    Helpers.checkUserPlatforms()
    this.fetch()
    window.addEventListener('CHANGE_LANG', this.fetch, false)
  }

  fetch = () => {
    const { id } = this.state.data
    api.get(`/v1/offers/${id}?expand=countries,trafficSources`)
    .then(response => {
      response.data.trafficSources = response.data.trafficSources.map(item => item.id)
      this.setState({
        isLoading: false,
        data: response.data
       })
    })

    // landing
    api.get(`v1/landings`, {
      headers: {
        'x-linkable': 'enabled',
      },
      params: {
        'q[offer_id][equal]': id,
        'per-page': 999,
      }
    })
    .then(response => {
      this.setState({ landings: response.data })
    })

    // actions
    api.get(`v1/actions?q[offer_id][equal]=${id}&fields=name`)
    .then(response => this.setState({ actions: response.data }))


    // trafficSources
    api.get(`v1/traffic-sources?fields=id,name`)
    .then(response => this.setState({ sources: response.data }))
  }

  renderTrafficSources = () => {
    const { sources, data } = this.state
    if(!sources) return <span>{t('emptyText')}</span>
    return sources.map((item, i) => {
      let isActive = false
      if(data.trafficSources && data.trafficSources.includes(item.id)) isActive = true
      return (
        <p key={i} className={!isActive && 'inactive' || 'active'}>{isActive && <Feather.CheckCircle /> || <Feather.XCircle /> }{item.name}</p>
      )
    })
  }

  renderTargeting = () => {
    const { showTargeting } = this.state
    const { countries } = this.state.data
    if(!countries) return <span>{t('emptyText')}</span>
    const btn = !showTargeting && countries.length > 2 && <a onClick={this._showTargeting}>{t('button.show_all')}</a>
    const items = countries.map((item, i) => {
      if(!showTargeting && i > 2) return null
      return (
        <p key={i} className="flex"><img src={`/img/flags/${item.code.toLowerCase()}.svg`} />{item.name}</p>
      )
    })
    return <div>{items}{btn}</div>
  }

  _showTargeting = () => {
    this.setState({ showTargeting: true })
    console.log('show targeting');
  }

  render() {
    const { data, landings, actions, sources, isLoading } = this.state

    // if edit
    let stream_id = window.location.pathname.includes('/streams/') && parseInt(window.location.pathname.split('/')[4])
    if(Number.isNaN(stream_id)) stream_id = false

    return (
      <div className="content__wrapper">
        <div className="content__inner offer">
          <div className="flex offer__header">
            <div className="offer__header-logo">
              <img src={data.logo} />
            </div>
            <div>
              <h3>{data.name}</h3>
              <div>{data.description}</div>
            </div>
          </div>
          <div className="link__group">
            <NavLink to={`/offers/${data.id}`} key={0} exact>{t('field.streams')}</NavLink>
            <NavLink to={`/offers/${data.id}/streams/add`} key={1} exact>{t('streams.add')}</NavLink>
            {stream_id && <NavLink to={`/offers/${data.id}/streams/${stream_id}`} key={2} exact>{t('streams.edit')}</NavLink>}
          </div>
          <Switch>
            <Route key={0} path={'/offers/:id'} component={Streams} exact />
            <Route key={1} path={'/offers/:offer_id/streams/add'} render={(props) => <StreamsForm {...props} offer_id={data.id} landings={landings} />} exact />
            <Route key={2} path={'/offers/:offer_id/streams/:id'} render={(props) => <StreamsForm {...props} offer_id={data.id} landings={landings} />} exact />
          </Switch>
        </div>
        <div className="content__sidebar">
          <Consultant />
          <div className="block offer__actions">
            <div>
              <h3>{t('field.rate')}</h3>
              {actions && actions.map((item, i) => <p key={i}>{item.name}</p>) || <span>{t('emptyText')}</span>}
            </div>
            <div className="offer__actions-sources">
              <h3>{t('field.platform')}</h3>
              {this.renderTrafficSources()}
            </div>
            <div className="offer__actions-targeting">
              <h3>{t('field.targeting')}</h3>
              {this.renderTargeting()}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Offer
