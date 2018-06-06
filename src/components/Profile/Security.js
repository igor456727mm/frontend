import React, { Component } from 'react'
import { Form, Input, InputNumber, Button, Select, message } from 'antd'
import qs from 'qs'
import * as Cookies from 'js-cookie'
import { connect } from 'react-redux'
import api from '../../common/Api'
import Helpers, { t, pick } from '../../common/Helpers'

class Security extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false
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
    const { user_id } = Cookies.get()
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      console.log(values);
      this.setState({ iconLoading: true })
      api.patch(`/v1/users/${user_id}`, qs.stringify(values))
      .then(response => {
        this.setState({ iconLoading: false })
        message.success(t('security.message.save'))
        form.resetFields()
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
      <div className="profile__personal">
        <Form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              {this.validator('old_password', t('field.old_password'), <Input size="large" />, [{ required: true }] )}
              {this.validator('new_password', t('field.new_password'), <Input size="large" />, [{ required: true }] )}
              {this.validator('repeat_password', t('field.repeat_password'), <Input size="large" />, [{ required: true }] )}
            </div>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>{t('button.save')}</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}



export default Form.create()(Security)
