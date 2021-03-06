import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon, Button, Popover } from 'antd'
import axios from 'axios'
import moment from 'moment'

import Helpers from '../common/Helpers'
import api from '../common/Api'

moment.locale('ru')

class Notifications extends Component {

  constructor(props) {
    super(props)
    this.state = {
      count: 0,
      visible: false,
      data: [],
    }

  }

  handleVisibleChange = (visible) => this.setState({ visible })

  hide = () => this.setState({ visible: false })

  componentDidMount() {
    this.fetch()

  }

  fetch = () => {
    api.get('/v1/notifications')
    .then((response) => {
      this.setState({ count: response.data.length, data: response.data })
    })
  }

  delete = () => {
    api.delete('/v1/notifications')
    .then((response) => {
      this.setState({ count: 0, data: [], visible: false })
    })
  }

  render() {
    const { count, visible, data } = this.state

    let content = <div className="h__notifications-empty">Нет уведомлений</div>
    if(data.length > 0) {
      content = data.map((item, i) => {
        const date = moment.unix(item.created_at).format('DD.MM.YY (HH:mm)')
        return (
          <div key={i} className="h__notifications-item" key={i}>
            <div className="h__notifications-date">{date}</div>
            <div className="h__notifications-title">{item.title}</div>
            <div className="h__notifications-text">{item.text}</div>
          </div>
        )
      })

      content.push(<Button key={data.length+1} className="btn-grey" onClick={this.delete} style={{ width: '100%' }}>Очистить все</Button>)
    }


    return (
        <div className="h__notifications pointer">

          <Popover
            content={content}
            trigger="click"
            visible={visible}
            onVisibleChange={this.handleVisibleChange}
          >
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18" viewBox="0 0 15 18"><desc>  Created with Sketch.</desc><g fill="none"><g fill="#7F8FA4"><path d="M14.8 14.4C14.6 14.8 14.2 15 13.8 15L10.5 15C10.5 16.7 9.2 18 7.5 18 5.8 18 4.5 16.7 4.5 15L1.2 15C0.8 15 0.4 14.8 0.2 14.4 0 14.1-0.1 13.7 0.2 13.2L2.3 9.6 2.3 5.3C2.3 2.4 4.6 0 7.5 0 10.4 0 12.8 2.4 12.8 5.3L12.8 9.6 14.8 13.2C15.1 13.7 15.1 14.1 14.8 14.4ZM7.5 16.5C8.3 16.5 9 15.8 9 15L6 15C6 15.8 6.7 16.5 7.5 16.5ZM11.3 10.1C11.2 9.9 11.2 9.7 11.3 9.5L11.3 5.4C11.3 5.4 11.3 5.3 11.3 5.3 11.3 3.2 9.6 1.5 7.5 1.5 5.4 1.5 3.8 3.2 3.8 5.3L3.8 9.8C3.8 9.8 3.7 9.8 3.7 9.8 3.7 9.8 3.7 9.9 3.7 9.9 3.7 10 3.7 10 3.7 10.1 3.7 10.1 3.7 10.1 3.7 10.1L1.7 13.5 13.3 13.5 11.3 10.1Z"></path></g></g></svg>
              {count && count > 0 ? <span className="h__notifications-unread">{count}</span> : null}
            </div>
          </Popover>
        </div>
    );
  }
}

export default Notifications
