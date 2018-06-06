import React, { Component } from 'react'
import { Form, Input, Button, Select, message } from 'antd'
import qs from 'qs'
import api from '../../common/Api'
import Helpers, { t } from '../../common/Helpers'

const FormItem = Form.Item
const Option = Select.Option
const { TextArea } = Input

class AddTicket extends Component {

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
      api.post('/v1/tickets', qs.stringify(values))
      .then(response => {
        const { id } = response.data
        form.resetFields()
        this.setState({ iconLoading: false })
        document.location = `/tickets/${id}`
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        e.response.data.forEach(error => {
          message.error(error.message)
        })
      })
    })
  }

  render() {
    const { iconLoading } = this.state
    const sections = Object.keys(this.props.sections).map((option, i) => <Option key={i} value={option}>{this.props.sections[option]}</Option>)
    return (
      <div className="block widget__tickets-add">
        <h3>{t('tickets.title')}</h3>
        <Form onSubmit={this.handleSubmit}>
          {this.validator('section', t('field.section'), <Select size="large">{sections}</Select>)}
          {this.validator('title', t('field.subject'), <Input size="large" />, [{ required: true }] )}
          {this.validator('message', t('field.message'), <TextArea size="large" style={{ height: '86px' }}/>, [{ required: true }] )}
          <FormItem className="form__item-last">
            <Button type="primary" htmlType="submit" size="large" loading={iconLoading} >
              {t('button.send')}
            </Button>
          </FormItem>
        </Form>
      </div>
    )
  }

}
export default Form.create()(AddTicket)
