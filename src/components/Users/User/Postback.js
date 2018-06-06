import React, { Component } from 'react'
import { Form, Input, InputNumber, Button, Select, message } from 'antd'
import qs from 'qs'
import * as Cookies from 'js-cookie'
import { connect } from 'react-redux'
import api from '../../common/Api'
import Helpers, { t, pick } from '../../common/Helpers'

class Postback extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      data: {
        global_postback_method: null,
        global_postback_url: null,
      }
    }
  }

  componentDidMount = () => {
    const { user_id } = Cookies.get()
    api.get(`/v1/user-data/${user_id}`)
    .then(response => {
      this.setState({ data: response.data })
    })
    .catch(e => {
      Helpers.errorHandler(e)
    })
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.state
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data[name]) {
      options.initialValue = data[name]
    } else if(initialValue) {
      options.initialValue = initialValue
    }
    return (
      <Form.Item className={`form__item-${name}`}>
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
      this.setState({ iconLoading: true })
      api.patch(`/v1/user-data/${user_id}`, qs.stringify(values))
      .then(response => {
        this.setState({ iconLoading: false })
        message.success(t('message.save'))
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  render() {
    const { iconLoading, data } = this.state
    console.log(data);
    return (
      <div className="profile__personal">
        <Form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div>
                <h4>Postback URL</h4>
                <div className="flex">
                  {this.validator('global_postback_method', '', (
                    <Select size="large">
                      <Select.Option key={'get'}>GET</Select.Option>
                      <Select.Option key={'post'}>POST</Select.Option>
                      <Select.Option key={'patch'}>PATCH</Select.Option>
                      <Select.Option key={'put'}>PUT</Select.Option>
                    </Select>
                  ), [], (data.global_postback_method || 'get'))}
                  {this.validator('global_postback_url', '', <Input size="large"/>, [] )}
                </div>
              </div>
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



export default connect((state) => pick(state, 'user'))(Form.create()(Postback))
