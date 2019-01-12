import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message, Tabs } from 'antd'
import moment from 'moment'
import qs from 'qs'
import { Link } from 'react-router-dom'
import Helpers, { Filters, t, pick, clean, disabledDate } from '../../../common/Helpers'
import api from '../../../common/Api'

import Personal from './Personal'
import Withdrawals from './Withdrawals'
import Referrals from './Referrals'
// import Bills from './Bills'

const Icons = {}
const TabPane = Tabs.TabPane

class User extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      data: {
        id: this.props.match.params.id
      },
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.users')
  }

  render() {
    const { id } = this.state.data
    return (
      <Tabs type="card">
        <TabPane tab="Информация" key="1">
          <Personal user_id={id} />
          <Withdrawals user_id={id} />
        </TabPane>
        <TabPane tab="Реферальная статистика" key="2">
          <Referrals user_id={id}/>
        </TabPane>
      </Tabs>
    )
  }

}

export default User
