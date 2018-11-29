import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import * as Cookies from "js-cookie";
import axios from "axios";
import { Router, BrowserRouter, Route, Redirect, withRouter, Switch, NavLink, Link } from 'react-router-dom';
import createHistory from 'history/createBrowserHistory'
import { connect } from 'react-redux'
import { Icon, Spin, message, Dropdown, Menu } from 'antd'
import qs from 'qs'
import * as Feather from 'react-feather'
import api from './common/Api'
import Auth, { AuthForm } from './common/Auth'
import Helpers, { t, pick } from './common/Helpers'
import { domain, scheme } from './config'
import Notifications from './components/Notifications'

// компоненты для роутинга
import Dashboard from './components/Dashboard'
import Tickets from './components/Tickets/Tickets'
import Ticket from './components/Tickets/Ticket'
import Promo from './components/Promo/Promo'
import Finance from './components/Finance/Finance'
import Stats from './components/Stats/Stats'

import News from './components/News'
import NewsItem from './components/News/Form'
import Platforms from './components/Platforms/Platforms'
import Offers from './components/Offers/Offers'
import Offer from './components/Offers/Offer'

import Users from './components/Users/Users'
import User from './components/Users/User'
import Conversions from './components/Conversions'
import Revises from './components/Revises'

import Advertisers from './components/Advertisers'
import Advertiser from './components/Advertisers/Advertiser'
import Partner from './components/Partner'

const NoMatch = ({ location }) => (
  <div>
    <h3>No match for <code>{location.pathname}</code></h3>
  </div>
);

const icons = {
  house: (
    <svg width="14" height="15" viewBox="0 0 14 15"><g fill="none"><g fill="#7F8FA4"><path d="M8 0.8L14 5.8C13.9 5.8 14 6 14 6.8L14 13.7C14 14.3 13.6 14.7 13 14.7L10 14.7C9.5 14.6 9.1 14.2 9 13.7L9 10.7C9.2 9.8 8.7 9.3 8 9.7L6 9.7C5.3 9.3 4.8 9.8 5 10.7L5 13.7C4.9 14.2 4.5 14.6 4 14.7L1 14.7C0.4 14.7 0 14.3 0 13.7L0 6.8C0 6.1 0.1 5.8 0 5.8L6 0.8C6.7 0.7 7.3 0.7 8 0.8"/></g></g></svg>
  ),
  profile: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18"><desc>  Created with Sketch.</desc><g fill="none"><g fill="#7F8FA4"><path d="M9 2.7C9 3.8 8.1 4.7 7 4.7 5.9 4.7 5 3.8 5 2.7 5 1.6 5.9 0.7 7 0.7 8.1 0.7 9 1.6 9 2.7L9 2.7 9 2.7ZM3.2 7.2L3.6 11.5C3.7 11.8 4 12.1 4.3 12.1L4.6 12.1C4.8 12.1 5 12.3 5 12.5L5.4 17.1C5.4 17.4 5.7 17.7 6.1 17.7L7.9 17.7C8.3 17.7 8.6 17.4 8.6 17.1L9 12.5C9 12.3 9.2 12.1 9.4 12.1L9.7 12.1C10.1 12.1 10.3 11.8 10.4 11.5L10.8 7.2C10.5 6.4 9.8 5.8 9 5.7L5 5.7C4.2 5.8 3.5 6.4 3.2 7.2L3.2 7.2ZM11.7 7.2L11.3 11.6C11.2 12.2 10.8 12.8 10.2 12.9 10 13 9.9 13.1 9.9 13.3L9.6 15.7C9.6 15.8 9.7 16 9.8 16.1 9.9 16.2 10 16.2 10.1 16.2L11.5 16.2C11.8 16.2 12.1 16 12.1 15.7L12.4 11.7C12.4 11.5 12.6 11.3 12.8 11.3L13.1 11.3C13.4 11.3 13.6 11.1 13.7 10.8L14 7C14 6.5 13.6 6.1 13.1 6.1L11.9 6.1C11.8 6.1 11.7 6.1 11.7 6.2 11.6 6.3 11.6 6.4 11.6 6.6 11.7 6.7 11.7 7 11.7 7.2L11.7 7.2 11.7 7.2ZM10.4 1.3C10.3 1.4 10.2 1.4 10.1 1.5 10.1 1.6 10.1 1.8 10.1 1.9 10.5 2.8 10.4 3.8 9.8 4.6 9.7 4.7 9.7 4.9 9.8 5 9.8 5.1 9.9 5.2 10 5.2 10.8 5.5 11.7 5.3 12.3 4.7 12.8 4 12.9 3.1 12.5 2.3 12.1 1.6 11.3 1.2 10.4 1.3L10.4 1.3 10.4 1.3ZM2.4 6.5C2.4 6.4 2.4 6.3 2.3 6.2 2.3 6.1 2.2 6.1 2.1 6.1L1 6.1C0.7 6.1 0.5 6.2 0.3 6.3 0.1 6.5 0 6.8 0 7L0.4 10.8C0.4 11.1 0.6 11.3 0.9 11.3L1.2 11.3C1.4 11.3 1.6 11.5 1.6 11.7L1.9 15.7C1.9 16 2.2 16.2 2.5 16.2L3.9 16.2C4 16.2 4.1 16.2 4.2 16.1 4.3 16 4.4 15.8 4.4 15.7L4.1 13.3C4.1 13.1 4 13 3.8 12.9 3.2 12.8 2.8 12.2 2.7 11.6L2.3 7.2C2.3 7 2.3 6.7 2.4 6.5L2.4 6.5 2.4 6.5ZM1.2 3.1C1.2 3.8 1.5 4.5 2 4.9 2.6 5.3 3.3 5.4 4 5.2 4.1 5.2 4.2 5.1 4.2 5 4.3 4.9 4.3 4.7 4.2 4.6 3.6 3.8 3.5 2.8 3.9 1.9 3.9 1.8 3.9 1.6 3.9 1.5 3.8 1.4 3.7 1.4 3.6 1.3 3 1.3 2.5 1.4 2 1.7 1.6 2.1 1.3 2.6 1.2 3.1L1.2 3.1 1.2 3.1Z"/></g></g></svg>
  ),
  news: (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16"><desc>  Created with Sketch.</desc><g fill="none"><g fill="#7F8FA4"><path d="M10.2 5C10.2 5.4 10.6 5.8 11 5.9L15 5.9C15.8 5.9 16.6 6.6 16 7L12.5 9.3C12.1 9.6 11.9 10 12.1 10.5L13.4 14.3C13.5 14.6 13.4 14.9 13.1 15.1 12.8 15.3 12.5 15.3 12.2 15.1L8.7 12.7C8.3 12.5 7.8 12.5 7.4 12.7L4 15.1C3.7 15.3 3.4 15.3 3.1 15.1 2.8 14.9 2.7 14.6 2.8 14.3L4.1 10.5C4.2 10 4.1 9.6 3.7 9.3L0.2 7C-0.4 6.6 0.3 5.9 1 5.9L5 5.9C5.5 5.8 5.9 5.4 6 5L7.4 1.1C7.5 0.8 7.8 0.6 8.1 0.6 8.4 0.6 8.7 0.8 8.8 1.1L10.2 5Z"/></g></g></svg>
  ),
  products: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><desc>  Created with Sketch.</desc><g fill="none"><g fill="#7F8FA4"><path d="M14.4 7.2L11.4 7.2C11.3 7.2 11.2 7.2 11.1 7.3L10 8.4C9.8 8.6 9.5 8.6 9.4 8.4 7.6 5.3 7.9 5.8 7.5 5.2 7.3 4.7 6.6 4.6 6.3 5L5.9 5.4 5.9 5.4 4.2 7.1C4.1 7.2 4 7.2 3.9 7.2L1.6 7.2 1.6 2.4C1.6 2 2 1.6 2.4 1.6L13.6 1.6C14 1.6 14.4 2 14.4 2.4L14.4 7.2ZM14.4 13.6C14.4 14 14 14.4 13.6 14.4L2.4 14.4C2 14.4 1.6 14 1.6 13.6L1.6 8.8 4.6 8.8C4.7 8.8 4.8 8.8 4.9 8.7L6.4 7.2C6.5 7 6.8 7.1 7 7.3 8.7 10.3 8.4 9.7 8.8 10.5 9.1 10.9 9.7 11 10.1 10.6L11.8 8.9C11.9 8.8 12 8.8 12.1 8.8L14.4 8.8 14.4 13.6ZM14.4 0L1.6 0C0.7 0 0 0.7 0 1.6L0 14.4C0 15.3 0.7 16 1.6 16L14.4 16C15.3 16 16 15.3 16 14.4L16 1.6C16 0.7 15.3 0 14.4 0L14.4 0Z"/></g></g></svg>
  ),
  promo: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 16 15"><desc>  Created with Sketch.</desc><g fill="none"><g fill="#7F8FA4"><path d="M3 14.5L13 14.5C12.8 14.5 13 14.3 13 14.5L13 3.6C13 3.5 12.8 3.3 13 3.6L12 3.6C11.9 3.3 11.8 3.2 12 3.6L12 2.6C11.8 1.5 11 0.7 10 0.6L6 0.6C5 0.7 4.1 1.5 4 2.6L4 3.6C4.2 3.2 4.1 3.3 4 3.6L3 3.6C3.2 3.3 3 3.5 3 3.6L3 14.5C3 14.3 3.2 14.5 3 14.5L3 14.5ZM6.8 1.6L9.2 1.6C9.7 1.6 10 1.7 10 1.6L10 2.6C10 2.5 9.9 2.6 10 2.6L6 2.6C6.1 2.6 6 2.5 6 2.6L6 1.6C6 1.7 6.3 1.6 6.8 1.6L6.8 1.6ZM2 3.6L2 14.5C2 14.3 1.8 14.5 2 14.5L1 14.5C0.5 14.5 0 14.1 0 13.5L0 4.5C0 4 0.5 3.6 1 3.6L2 3.6C1.8 3.6 2 3.8 2 3.6L2 3.6 2 3.6ZM14 3.6L15 3.6C15.5 3.6 16 4 16 4.5L16 13.5C16 14.1 15.5 14.5 15 14.5L14 14.5C14.2 14.5 14 14.3 14 14.5L14 3.6C14 3.8 14.2 3.6 14 3.6L14 3.6Z"/></g></g></svg>
  ),
  stats: (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 15 14"><desc>  Created with Sketch.</desc><g fill="none"><g fill="#7F8FA4"><path d="M2 11.5L14 11.5C14.5 11.5 15 11.9 15 12.5 15 13 14.6 13.5 14 13.5L2 13.5 0 13.5 0 1.5C0 1 0.4 0.5 1 0.5 1.6 0.5 2 1 2 1.5L2 11.5ZM6 7.5C6 7 6.4 6.5 7 6.5 7.6 6.5 8 6.9 8 7.5L8 9.5C8 10 7.6 10.5 7 10.5 6.4 10.5 6 10.1 6 9.5L6 7.5ZM3 9.5C3 8.9 3.4 8.5 4 8.5 4.6 8.5 5 8.9 5 9.5 5 10.1 4.6 10.5 4 10.5 3.4 10.5 3 10.1 3 9.5ZM12 3.5C12 3 12.4 2.5 13 2.5 13.6 2.5 14 3 14 3.5L14 9.5C14 10.1 13.6 10.5 13 10.5 12.4 10.5 12 10 12 9.5L12 3.5ZM9 5.5C9 5 9.4 4.5 10 4.5 10.6 4.5 11 5 11 5.5L11 9.5C11 10 10.6 10.5 10 10.5 9.4 10.5 9 10 9 9.5L9 5.5Z"/></g></g></svg>
  ),
  finance: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="17" viewBox="0 0 14 17"><desc>  Created with Sketch.</desc><g fill="none"><g fill="#7F8FA4"><path d="M0.3 16.2C0.1 16 0 15.7 0 15.5L0 13.5C0 13.2 0.1 12.9 0.3 12.7 0.5 12.5 0.7 12.4 1 12.5L3 12.5C3.3 12.4 3.5 12.5 3.7 12.7 3.9 12.9 4 13.2 4 13.5L4 15.5C4 15.7 3.9 16 3.7 16.2 3.5 16.4 3.3 16.5 3 16.5L1 16.5C0.7 16.5 0.5 16.4 0.3 16.2ZM5 15.5L5 1.5C5 0.9 5.5 0.5 6 0.5L8 0.5C8.6 0.5 9 0.9 9 1.5L9 15.5C9 16 8.6 16.4 8 16.5L6 16.5C5.5 16.4 5 16 5 15.5ZM10 15.5L10 6.5C10 5.9 10.5 5.5 11 5.5L13 5.5C13.5 5.5 14 5.9 14 6.5L14 15.5C14 16 13.5 16.4 13 16.5L11 16.5C10.5 16.4 10 16 10 15.5Z"/></g></g></svg>
  ),
  support: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17"><desc>  Created with Sketch.</desc><g fill="none"><g fill="#7F8FA4"><path d="M8 0.4C3.6 0.4 0 4 0 8.4 0 12.8 3.6 16.4 8 16.4 12.4 16.4 16 12.8 16 8.4 16 4 12.4 0.4 8 0.4L8 0.4ZM9.7 3.2L9.9 2.7C9.9 2.4 10.1 2.3 10.3 2.2 10.5 2.1 10.8 2.1 11 2.2 12.4 2.8 13.6 4 14.3 5.5 14.4 5.7 14.4 5.9 14.3 6.1 14.2 6.3 14 6.5 13.7 6.6L13.2 6.7C12.9 6.8 12.6 6.6 12.4 6.3 11.9 5.3 11.1 4.5 10.1 4 9.8 3.9 9.6 3.5 9.7 3.2L9.7 3.2 9.7 3.2ZM1.7 5.4C2.4 4 3.6 2.8 5 2.1 5.3 2 5.5 2 5.7 2.1 5.9 2.3 6.1 2.4 6.1 2.7L6.3 3.2C6.3 3.5 6.2 3.9 5.9 4 4.9 4.5 4.1 5.3 3.6 6.3 3.4 6.6 3.1 6.8 2.7 6.7L2.2 6.5C2 6.5 1.8 6.3 1.7 6.1 1.6 5.9 1.6 5.7 1.7 5.5L1.7 5.5 1.7 5.4ZM6.3 13.7L6.1 14.2C6.1 14.4 5.9 14.6 5.7 14.7 5.5 14.8 5.2 14.8 5 14.7 3.6 14 2.4 12.8 1.7 11.4 1.6 11.2 1.6 10.9 1.7 10.7 1.8 10.5 2 10.3 2.3 10.3L2.8 10.2C3.1 10.1 3.4 10.2 3.6 10.5 4.1 11.5 4.9 12.3 5.9 12.8 6.2 13 6.4 13.3 6.3 13.7L6.3 13.7 6.3 13.7ZM4.2 8.4C4.2 6.3 5.9 4.6 8 4.6 10.1 4.6 11.8 6.3 11.8 8.4 11.8 10.5 10.1 12.3 8 12.3 5.9 12.3 4.2 10.5 4.2 8.4L4.2 8.4 4.2 8.4ZM14.3 11.4C13.6 12.8 12.4 14 11 14.7 10.7 14.8 10.5 14.8 10.3 14.7 10.1 14.6 9.9 14.4 9.9 14.2L9.7 13.7C9.7 13.3 9.8 13 10.1 12.8 11.1 12.3 11.9 11.5 12.4 10.5 12.6 10.2 12.9 10.1 13.3 10.1L13.8 10.3C14 10.3 14.2 10.5 14.3 10.7 14.4 10.9 14.4 11.2 14.3 11.4L14.3 11.4 14.3 11.4Z"/></g></g></svg>
  ),
  platforms: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 16 15"><title>  Icon</title><desc>  Created with Sketch.</desc><g fill="none"><g style={{'strokeWidth':2, stroke: '#7F8FA4'}}><g transform="translate(-30 -505)translate(31 506)"><rect x="3" y="3" width="11" height="10" rx="1"/><polyline points="0 6 0 0 8 0" strokeLinejoin="round"/></g></g></g></svg>
  )
}

const history = createHistory()
const routes = [
  {
    path: '/',
    component: () => <Redirect to={`/dashboard`} />,
    exact: true
  },
  { path: '/dashboard',
    component: Dashboard,
    exact: true
  },
  {
    path: '/tickets',
    component: Tickets,
    exact: true
  },
  {
    path: '/tickets/:id',
    component: Ticket,
    exact: true
  },
  {
    path: '/finance',
    component: Finance
  },
  {
    path: '/promo',
    component: Promo,
  },
  {
    path: '/stats',
    component: Stats,
  },
  {
    path: '/conversions',
    component: Conversions,
  },
  {
    path: '/revises',
    component: Revises,
  },
  {
    path: '/news',
    component: News,
    exact: true,
  },
  {
    path: '/news/:id',
    component: NewsItem,
    exact: true,
  },
  {
    path: '/platforms',
    component: Platforms
  },
  {
    path: '/offers',
    component: Offers,
    exact: true
  },
  {
    path: '/offers/:id',
    component: Offer,
  },
  {
    path: '/users',
    component: Users,
    exact: true
  },
  {
    path: '/users/:id',
    component: User,
  }, {
    path: '/news',
    component: News,
    exact: true,
  },
  {
    path: '/news/:id',
    component: NewsItem,
  },
  {
    path: '/advertisers',
    component: Advertisers,
    exact: true
  },
  {
    path: '/advertisers/:id',
    component: Advertiser,
    exact: true
  },
  {
    path: '/partner',
    component: Partner,
    exact: true
  },
]

const getUrlParam = (key) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key)
}

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: true,
    }
  }

  componentDidMount = async () => {

    // languages
    const code = getUrlParam('lang') || Cookies.get('lang') || this.props.lang.current
    this._onChangeLang(code)

    // languages list
    api.get(`/v1/languages`)
    .then(response => {
      this.props.dispatch({
        type: 'LOAD_LANG_LIST',
        list: response.data.map(item => pick(item, 'name', 'code'))
      })
    })

    // auth
    const isAuthorized = await Auth.check()
    this.setState({ isLoading: false, isAuthorized: isAuthorized })
    if(isAuthorized) this._onUserLogin()
    window.addEventListener('user.exit', () => {
      this.setState({ isAuthorized: false })
    }, false)

  }

  _onUserLogin = () => {
    this.setState({ isAuthorized: true })
    // Helpers.checkUserData()
    //Helpers.checkUserPlatforms()
    //Helpers.checkUserWallets()
    //Helpers.checkTicketMessages()

    Helpers.checkTicketMessages()
    setTimeout(() => Helpers.checkTicketMessages(), 1000 * 10)

    /*
    api.get('/v1/manager-access')
    api.get('/v1/manager-access/actions')
    api.get('/v1/manager-access/types')
    api.get('/v1/manager-access/models')
    */

  }

  _onChangeLang = (e) => {
    const { lang } = this.props
    const key = e.target && e.target.dataset.lang || e
    Cookies.set('lang', key, { expires: 365 })
    if(!lang.translations[key]) {
      api.get(`${scheme}system-api.${domain}/v1/settings/client-messages`)
      .then(response => {
        this.props.dispatch({
          type: 'CHANGE_LANG',
          key: key,
          translation: response.data
        })
      })
    } else {
      this.props.dispatch({ type: 'CHANGE_LANG', key: key })
    }
  }

  render() {

    const { isLoading, isAuthorized } = this.state
    const { lang } = this.props
    const { title } = this.props.config
    const { unreadMessages } = this.props.user

    if(isLoading) {
      return (
        <div className="__center">
          <div className="block__loading">
            <Icon type="loading" spin />
          </div>
        </div>
      )
    } else if(!isAuthorized) {
      return (
        <div className="__center">
          <div className="block block__auth">
            <a href={`https://${domain}`} className="block__auth-logo">
              <img src="/img/logo.svg" />
            </a>
            <AuthForm onLogin={this._onUserLogin} />
          </div>
        </div>
      )
    }

    const content = routes.map((route, i) => <Route ref={route.component && route.component.name} key={i} {...route} />)
    // const { unreadMessages } = this.props.user

    const menu_lang = lang.list.map(item => {
      if(item.code == lang.current) return
      return (
        <Menu.Item key={item.code}>
          <span data-lang={item.code} onClick={this._onChangeLang}>{item.name}</span>
        </Menu.Item>
      )
    })



    return (
      <BrowserRouter>
        <Router history={history}>
          <div>
            <div className="wrapper">
              <header>
                <div className="container">
                  <div className="flex h__sidebar-container">
                    <Link to="/" className="h__logo">
                      <img src="/img/logo.svg" />
                    </Link>
                    <Dropdown overlay={(<Menu className="lang__menu">{menu_lang}</Menu>)} trigger={['click']}>
                       <span className="h__lang flex pointer ant-dropdown-link">
                        {lang.current.toUpperCase()}
                        <Feather.ChevronDown />
                       </span>
                     </Dropdown>
                  </div>
                  <div className="h__title">{t(title)}</div>
                  <div className="h__user">
                    <span onClick={Auth.exit}>{t('menu.exit')}</span>
                  </div>
                </div>
              </header>
              <div className="sidebar">
                <ul className="sidebar__menu">
                  <li><NavLink to="/dashboard">{icons.house} {t('menu.dashboard')}</NavLink></li>
                  {/* <li><NavLink to="/news">{icons.news} {t('menu.news')}</NavLink></li> */}
                  <li><NavLink to="/platforms">{icons.platforms} {t('menu.platforms')}</NavLink></li>
                  <li><NavLink to="/offers">{icons.products} {t('menu.offers')}</NavLink></li>
                  <li><NavLink to="/news">{icons.products} {t('menu.news')}</NavLink></li>
                  {/* <li><NavLink to="/promo">{icons.promo} {t('menu.promo')}</NavLink></li> */}
                  <li><NavLink to="/stats">{icons.stats} {t('menu.stats')}</NavLink></li>
                  <li><NavLink to="/conversions">{icons.stats} {t('menu.conversions')}</NavLink></li>
                  <li><NavLink to="/revises">{icons.stats} {t('menu.revises')}</NavLink></li>
                  <li><NavLink to="/users">{icons.support} {t('menu.users')}</NavLink></li>
                  <li><NavLink to="/finance">{icons.finance} {t('menu.finance')}</NavLink></li>
                  <li><NavLink to="/advertisers">Рекламодатели</NavLink></li>
                  <li><NavLink to="/partner">Модули партнеров</NavLink></li>
                  <li><NavLink to="/tickets" className="relative">{icons.support} {t('menu.support')} {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}</NavLink></li>
                </ul>
                <div className="sidebar__copyright">
                ©2018 gambling.pro
                <br />All rights reserved.
                </div>
              </div>
              <div className="content" id="content">
                <Switch>
                  {content}
                </Switch>
              </div>

            </div>
          </div>
        </Router>
      </BrowserRouter>
    )

  }
}

function mapStateToProps (state) {
	return state
}

export default connect(mapStateToProps)(App)
