import React, { Component } from 'react'
import { Route, Redirect, Switch, NavLink } from 'react-router-dom'
import Helpers, { t, pick } from '../../common/Helpers'
import Consultant from '../Widgets/Consultant'
import News from '../Widgets/News'
import Personal from './Personal'
import Payments from './Payments/Payments'
import Security from './Security'
import Postback from './Postback'

const routes = [
  {
    name: 'profile.personal',
    path: '/profile',
    component: Personal,
    exact: true
  },
  {
    name: 'profile.payments',
    path: '/profile/payments',
    component: Payments,
    exact: true
  },
  {
    name: 'profile.security',
    path: '/profile/security',
    component: Security,
    exact: true
  },
  {
    name: 'profile.postback',
    path: '/profile/postback',
    component: Postback,
    exact: true
  },
]

class Profile extends Component {

  componentDidMount = () => {
    Helpers.setTitle('menu.profile')
  }

  render() {
    return (
      <div className="content__wrapper">
        <div className="content__inner profile">
          <div className="link__group">
            {routes.map((route, i) => <NavLink to={route.path} key={i} exact>{t(route.name)}</NavLink> )}
          </div>
          <Switch>
            {routes.map((route, i) => <Route ref={route.component && route.component.name} key={i} {...route} />)}
          </Switch>
        </div>
        <div className="content__sidebar">
          <Consultant />
          <News />
        </div>
      </div>
    )
  }
}

export default Profile
