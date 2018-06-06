import React, { Component } from 'react'
import { Form, Input, InputNumber, Button, Select, message } from 'antd'
import qs from 'qs'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import api from '../../common/Api'
import Helpers, { t, pick } from '../../common/Helpers'

class Withdraw extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
    }
  }

  validator = (name, label, input, rules = []) => {
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    return (
      <Form.Item>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      this.setState({ iconLoading: true })
      api.post(`/v1/withdrawals`, qs.stringify({ ...values, update_if_unpaid: 1 }))
      .then(response => {
        this.setState({ iconLoading: false })
        form.resetFields()
        message.success(t('withdraw.message.success'))
        window.dispatchEvent(new Event('finance.fetch'))
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  render() {
    const { iconLoading } = this.state
    const { wallets } = this.props.user
    const _wallets = wallets.map(item => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)
    return (
      <div className="block widget__finance-withdraw">
        <h3>{t('withdraw.title')}</h3>
        {wallets.length == 0 && (
          <div>
            <p>{t('withdraw.empty.text')}</p>
            <Link to={`/profile/payments`} className="ant-btn ant-btn-primary ant-btn-lg">{t('withdraw.empty.button')}</Link>
          </div>
        ) || (
          <Form onSubmit={this.handleSubmit}>
            <p>{t('withdraw.text')}</p>
            {this.validator('sum', t('field.sum'), <InputNumber min={1} size="large" />, [{ required: true }] )}
            {this.validator('wallet_id', t('field.wallet'), <Select size="large">{_wallets}</Select>, [{ required: true }] )}
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>{t('withdraw.button')}</Button>
            </Form.Item>
          </Form>
        )}
      </div>
    )

  }


}

export default connect((state) => pick(state, 'user', 'lang'))(Form.create()(Withdraw))
