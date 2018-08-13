import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import Helpers, { t, pick, Events } from '../../../common/Helpers'
import api from '../../../common/Api'

class HoldToBalance extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
    }
  }

  componentDidMount = () => {

  }

  validator = (name, label, input, rules = []) => {
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    return (
      <Form.Item>
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
      api.post(`/v1/user-data/${user_id}/hold-to-balance`, qs.stringify(values))
      .then(response => {
        this.setState({ iconLoading: false })
        message.success('Холд переведен на баланс')
        Events.dispatch('user.fetch')
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
      <Form onSubmit={this.handleSubmit} className="flex" style={{ margin: '30px 0' }}>
        <div style={{ fontSize: '16px' }}>Перевести с холда на баланс</div>
        <Form.Item style={{ margin: '0 20px' }}>
          <Input size="large" disabled value={this.props.hold} placeholder="Сумма" />
        </Form.Item>
        <Form.Item className="form__item-last">
          <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>Перевести</Button>
        </Form.Item>
      </Form>
    )
  }
}

export default Form.create()(HoldToBalance)
