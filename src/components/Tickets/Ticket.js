import React, { Component } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Icon, Input, Button, Form } from 'antd'
import { connect } from 'react-redux'
import moment from 'moment'
import qs from 'qs'
import * as Cookies from 'js-cookie'
import Helpers, { t, pick } from '../../common/Helpers'
import api from '../../common/Api'
import Consultant from '../Widgets/Consultant'
import News from '../Widgets/News'

class _MessageForm extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
    }
  }

  validator = (name, input, rules = []) => {
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    return (
      <Form.Item className={`form__item-${name}`}>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values.ticket_id = this.props.ticket_id
      this.setState({ iconLoading: true })
      api.post(`v1/ticket-messages`, qs.stringify(values), { params: { expand: 'user' } })
      .then(response => {
        this.setState({ iconLoading: false })
        form.resetFields()
        this.props.onSend(response.data)
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  render() {
    const { iconLoading } = this.state
    return (
      <Form className="flex ticket__message-form" onSubmit={this.handleSubmit}>
        {this.validator('text', <Input.TextArea placeholder={'Введите сообщение.\nEnter - новая строка'} size="large" style={{ height: '350px' }}/>, [{ required: true, min: 3, message: ' ' }] )}
        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>{t('button.send')}</Button>
        </Form.Item>
      </Form>
    )
  }
}

const MessageForm = Form.create()(_MessageForm)

class Ticket extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: {
        id: props.match.params.id,
      },
      messages: [],
      sections: {},
      statuses: {},
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.support')
    this.fetch()
    this.fetchMessages()
    this.scrollToBottom()

    api.get('/v1/tickets/statuses')
    .then(response => {
      this.setState({ statuses: response.data })
    })

    api.get('/v1/tickets/sections')
    .then(response => {
      this.setState({ sections: response.data })
    })
  }

  componentDidUpdate = () => {
    this.scrollToBottom()
  }

  fetch = () => {
    const { id } = this.state.data
    api.get(`/v1/tickets/${id}`)
    .then((response) => {
      this.setState({ data: response.data })
    })
  }

  fetchMessages = () => {
    const { id } = this.state.data
    api.get('/v1/ticket-messages', {
      params: {
        'sort': 'id',
        'q[ticket_id][equal]': id,
        'per-page': 999,
        'expand': 'user'
      }
    })
    .then(response => {
      this.setState({ messages: response.data })
      // пометка сообщений прочитанными

      api.patch(`/v1/ticket-messages?q[ticket_id][equal]=${id}`, qs.stringify({ status: 'read' }) )
      .then(() => {
        Helpers.checkTicketMessages()
      })
    })
  }

  scrollToBottom = () => {
    const messagesContainer = document.getElementById("ticket__messages")
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  renderMessages = () => {
    const { messages } = this.state
    let { avatar_image, user_id } = this.props.user
    return messages.map(item => {
      //const isSelf = [1, 256].includes(item.user_id)
      const isSelf = item.user && item.user.role !== 'webmaster'
      const cls = isSelf && 'ticket__message-self' || ''
      const img = isSelf && avatar_image || '/img/support.jpg'
      return (
        <div className={`flex ticket__message ${cls}`} key={item.id}>
          <div className="ticket__message-avatar" style={{ backgroundImage: `url(${img})`}}></div>
          <div className="ticket__message-text">
            {item.text}
            <div>#{item.user && item.user.id} {item.user && item.user.login}</div>
          </div>
        </div>
      )
    })
  }

  _onSend = (message) => {
    const { messages } = this.state
    messages.push(message)
    this.setState({ messages: messages })
  }

  render() {
    const { data, sections, statuses } = this.state
    const date = moment.unix(data.created_at).format('DD.MM.YYYY (HH:mm)')
    const status = Helpers.renderStatus(data.status, statuses)
    const messages = this.renderMessages()
    return (
      <div className="content__wrapper">
        <div className="content__inner">
          <div className="ticket block">
            <div className="ticket__header">
              <h3>{data.title}</h3>
              {t('field.section')}: {sections[data.section]}
              &nbsp;&nbsp;&nbsp;
              {t('field.date')}: {date}
              &nbsp;&nbsp;&nbsp;
              {t('field.status')}: {status}
            </div>
            <div className="ticket__messages" id="ticket__messages">
            {messages}
            </div>
          </div>
          <MessageForm ticket_id={data.id} onSend={this._onSend} />
        </div>
        <div className="content__sidebar">
          <Consultant />
          <News />
        </div>
      </div>
    )
  }
}

export default connect((state) => pick(state, 'user'))(Ticket)
