import React, { Component } from 'react'
import { Form, Input, Button, Select, message } from 'antd'
import qs from 'qs'
import api from '../../../common/Api'
import Helpers, { t } from '../../../common/Helpers'

class Add extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      data: [],
    }
  }

  componentDidMount = () => {
    this.fetch()
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

  fetch = () => {
    this.setState({ isLoading: true })
    api.get('/v1/finances/wallets', {
      params: {
        'q[ownerId][null]': 1,
        sort: '-id',
      }
    })
    .then(response => {
      console.log('system wallets response', response.data);
      this.setState({
        isLoading: false,
        data: response.data,
      })
    })
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, updateWallets } = this.props
    const { data } = this.state
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      console.log('Wallets form values', values);
      console.log('Wallets form values data', data);
      const selectedWallet = data.find(el => String(el.id) === String(values.wallet_id))
      console.log('selectedWallet', selectedWallet);
      values.walletModuleId = selectedWallet.walletModuleId
      values.name = values.name
      values.number = selectedWallet.data.number
      updateWallets(values)
      form.resetFields()
    })
  }

  render() {
    const { iconLoading, data } = this.state
    const wallets = data.map(wallet => <Select.Option key={wallet.id}>{wallet.name} / {wallet.data && wallet.data.number}</Select.Option>)
    return (
      <div className="widget__wallets-add">
        <h3>{t('wallets.add')}</h3>
        <Form onSubmit={this.handleSubmit}>
          {this.validator('name', t('field.name'), <Input size="large" />, [{ required: true }] )}
          {this.validator('wallet_id', '', <Select placeholder="Кошелек не выбран" size="large">{wallets}</Select>, [{ required: true }] )}
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>{t('button.save')}</Button>
          </Form.Item>
        </Form>
      </div>
    )

  }


}

export default Form.create()(Add)
