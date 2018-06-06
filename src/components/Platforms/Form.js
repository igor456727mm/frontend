import React, { Component } from 'react'
import { Form, Input, InputNumber, Button, Select, message, Checkbox, Popconfirm, Modal } from 'antd'
import { connect } from 'react-redux'
import qs from 'qs'
import api from '../../common/Api'
import Helpers, { t, pick } from '../../common/Helpers'
// import Icons from '../../common/Icons'
import copy from 'copy-to-clipboard'

const Icons = {}

class _Form extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      isVisible: false,
      isEdit: props.data ? true : false
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(this.props.data) options.initialValue = this.props.data[name]
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, data } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      Object.keys(values).forEach(key => values[key] === undefined ? delete values[key] : '')
      if(data && data.id) {
        api.patch(`/v1/platforms/${data.id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('platforms.form.message.save'))
          window.dispatchEvent(new Event('platforms.fetch'))
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        api.post(`/v1/platforms`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('platforms.form.message.add'))
          window.dispatchEvent(new Event('platforms.fetch'))
          form.resetFields()
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }
    })
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  render() {
    const { isVisible, iconLoading, isEdit } = this.state
    const { types, data } = this.props
    const _types = Object.keys(types).map(item => <Select.Option key={item} value={item}>{types[item]}</Select.Option>)
    return (
      <span>
        {isEdit && <span onClick={this._toggle}>Ред.</span> || <Button onClick={this._toggle} type="primary" size="large">{t('button.add')}</Button>}
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
          <h1>{isEdit ? `Площадка #${data.id}` : 'Добавление площадки'}</h1>
          <Form onSubmit={this.handleSubmit}>
            {this.validator('name', t('field.name'), <Input size="large" />, [{ required: true }] )}
            {this.validator('type', t('field.type'), <Select size="large">{_types}</Select>, [{ required: true }] )}
            {this.validator('url', t('field.url'), <Input size="large" />, [] )}
            <Form.Item className="form__item-last">
              <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>{t('button.save')}</Button>
            </Form.Item>
          </Form>
        </Modal>
      </span>
    )
  }

}

export default connect((state) => pick(state, 'user'))(Form.create()(_Form))
