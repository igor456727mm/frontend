import React, { Component } from 'react'
import { Form, Input, Table, InputNumber, Modal, Button, message, Select } from 'antd'
import qs from 'qs'
import * as Cookies from 'js-cookie'
import { connect } from 'react-redux'
import api from '../../../common/Api'
import Helpers, { t, pick, flatten, clean } from '../../../common/Helpers'

const Icons = {}

class _Edit extends Component {

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
    const { data } = this.props
    const options = { rules: rules }
    if(data && data.hasOwnProperty(name)) options.initialValue = data[name]
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, data, user_id } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)
      const key = data && (data.user_id && data.currency_id) && `${data.user_id},${data.currency_id}`

      if(key) {
        api.patch(`/v1/user-bills/${key}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Счет сохранен'))
          window.dispatchEvent(new Event('bills.fetch'))
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        values.user_id = user_id
        api.post(`/v1/user-bills`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Счет добавлен'))
          window.dispatchEvent(new Event('bills.fetch'))
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
    const { data } = this.props
    const currency = isEdit && Helpers.renderCurrency(data.currency_id)
    const name = isEdit ? `Баланс, ${currency}` : `Баланс`
    return (
      <span>
        {isEdit && <span onClick={this._toggle}>{Icons.settings}</span> || <Button onClick={this._toggle}>{t('button.add')}</Button>}
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
          <h1>{isEdit ? `Счет #${data.user_id},${data.currency_id}` : 'Добавление счета'}</h1>
          <Form onSubmit={this.handleSubmit}>
            {!isEdit && this.validator('currency_id', t('field.currency'), (
              <Select size="large">
                <Select.Option key="1" value={1}>USD</Select.Option>
                <Select.Option key="48" value={48}>EUR</Select.Option>
                <Select.Option key="123" value={123}>RUB</Select.Option>
              </Select>
            ), [{ required: true }] )}
            {this.validator('balance', name, <InputNumber min={0} step={0.000001} size="large" />, [{ required: true }] )}
            <Form.Item className="form__item-last">
              <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>{t('button.save')}</Button>
            </Form.Item>
          </Form>
        </Modal>
      </span>
    )
  }

}

const Edit = Form.create()(_Edit)


class Bills extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      pagination: {
        hideOnSinglePage: true,
      },
      columns: [
        {
          title: 'Валюта',
          dataIndex: 'currency_id',
          render: (text, row) => Helpers.renderCurrency(text),
        },
        {
          title: 'Баланс',
          dataIndex: 'balance',
        },
        {
          title: <Edit user_id={this.props.user_id} />,
          width: 150,
          render: (text, row) => (
            <div className="table__actions">
              <Edit data={row} />
            </div>
          )
        }
      ]
    }
  }

  componentDidMount = () => {
    this.fetch()
    window.addEventListener(`bills.fetch`, this.fetch)
  }

  componentWillUnmount = () => {
    window.removeEventListener(`bills.fetch`, this.fetch)
  }

  fetch = () => {
    const { pagination } = this.state
    const { user_id } = this.props
    this.setState({ isLoading: true })
    api.get('/v1/user-bills', {
      params: {
        sort: '-created_at',
        'q[user_id][equal]': user_id,
        'per-page': 100,
      }
    })
    .then(response => {
      pagination.total = parseInt(response.headers['x-pagination-total-count'])
      this.setState({
        isLoading: false,
        data: response.data,
        pagination
      })
    })
  }

  render() {
    const { isLoading } = this.state
    const props = pick(this.state, 'data:dataSource', 'columns', 'pagination', 'isLoading:loading')
    return (
      <div>
        <Table
          rowKey={(item, i) => i}
          locale={{ emptyText: Helpers.emptyText }}
          {...props}
          />
      </div>
    )
  }

}

export default Bills
