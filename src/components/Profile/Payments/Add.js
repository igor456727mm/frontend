import React, { Component } from 'react'
import { Form, Input, InputNumber, Button, Select, message } from 'antd'
import qs from 'qs'
import { connect } from 'react-redux'
import api from '../../../common/Api'
import Helpers, { t, pick } from '../../../common/Helpers'

class Add extends Component {

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
      values.data = JSON.stringify(values.data)
      api.post(`/v1/wallets`, qs.stringify(values))
      .then(response => {
        this.setState({ iconLoading: false })
        form.resetFields()
        message.success(t('wallets.add.message.success'))
        window.dispatchEvent(new Event('wallets.fetch'))
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  renderWalletNumber = () => {
    const { form, modules } = this.props
    const { wallet_module_id } = form.getFieldsValue()
    if(!wallet_module_id) return
    const { rules } = modules[wallet_module_id]
    return rules.required.map(field => {
      const message = modules[wallet_module_id].error_messages[`/${field}`].pattern
      return this.validator(`data[${field}]`, rules.properties[field].title, <Input size="large" />, [{ required: true, pattern: rules.properties[field].pattern, message: message }] )
    })
  }

  render() {
    const { iconLoading } = this.state
    const { modules } = this.props
    const _modules = Object.keys(modules).map(key => <Select.Option key={key}>{modules[key] && modules[key].name}</Select.Option>)
    return (
      <div className="widget__wallets-add">
        <h3>{t('wallets.add')}</h3>
        <Form onSubmit={this.handleSubmit}>
          {this.validator('wallet_module_id', t('field.type'), <Select size="large">{_modules}</Select>, [{ required: true }] )}
          {this.validator('name', t('field.name'), <Input size="large" />, [{ required: true }] )}
          {this.renderWalletNumber()}
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>{t('button.save')}</Button>
          </Form.Item>
        </Form>
      </div>
    )

  }


}

export default Form.create()(Add)
