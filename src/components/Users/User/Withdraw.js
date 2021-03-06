import React, { Component } from 'react'
import { Form, Table, Select, Input, InputNumber, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import Helpers, { t, pick, Events } from '../../../common/Helpers'
import api from '../../../common/Api'

class Withdraw extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      wallets: [],
    }
  }

  componentDidMount = () => {
    const { user_id } = this.props
    api.get(`/v1/wallets?q[user_id][equal]=${user_id}`)
    .then(response => {
      this.setState({ wallets: response.data })
    })
    .catch(Helpers.errorHandler)
  }

  validator = (name, label, input, rules = [], style = {}) => {
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    return (
      <Form.Item style={style}>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, user_id } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      this.setState({ iconLoading: true })
      api.post(`/v1/withdrawals`, qs.stringify({ ...values, update_if_unpaid: 1, currency_id: 1 }))
      .then(response => {
        this.setState({ iconLoading: false })
        message.success('Выплата заказана')
        Events.dispatch('withdrawals.fetch')
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  render() {
    const { iconLoading, wallets } = this.state
    const _wallets = wallets.map(item => <Select.Option key={item.id} value={item.id}>{item.name} / {item.data && item.data.number}</Select.Option>)
    return (
      <Form onSubmit={this.handleSubmit} className="flex">
        <div style={{ fontSize: '16px' }}>Заказать выплату</div>
        {this.validator('sum', '', <InputNumber size="large" placeholder={this.props.balance} />, [{ required: true }], { margin: '0 20px' } )}
        {this.validator('wallet_id', '', <Select placeholder="Кошелек не выбран" style={{ width: '200px' }} size="large">{_wallets}</Select>, [{ required: true }], { margin: '0 20px 0 0' } )}
        <Form.Item className="form__item-last">
          <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>Заказать</Button>
        </Form.Item>
      </Form>
    )
  }
}

export default Form.create()(Withdraw)
