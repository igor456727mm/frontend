import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import { Link } from 'react-router-dom'
import Helpers, { Filters, t, pick, clean, disabledDate } from '../../../common/Helpers'
import api from '../../../common/Api'

import Personal from './Personal'
// import Bills from './Bills'

const Icons = {}


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
      <div>
        <Personal user_id={id} />

      </div>
    )
  }

}

export default User
