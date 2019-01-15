import React, { Component } from 'react'
import { Form, Table, Select, Input, InputNumber, DatePicker, Button, message, Upload, Icon, Checkbox, Modal, Popconfirm, Popover } from 'antd'
import moment from 'moment'
import { cookie_prefix } from '../../../package.json'
import Cookies from 'js-cookie'
import qs from 'qs'
import { connect } from 'react-redux'
import { Route, Redirect, Switch, NavLink, Link } from 'react-router-dom'
import Helpers, { t, pick, clean, TreeSelectRemote, OfferAccessButton, flatten } from '../../common/Helpers'
import SearchSelect from '../../common/Helpers/SearchSelect'
import api from '../../common/Api'
import * as Feather from 'react-feather'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import * as Manager from '../../common/Helpers/ManagerSelect'

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

const { RangePicker } = DatePicker

const paymentDateHelp = (
  <Popover placement="right" content={(
    <span>
      Сначала укажите интервал сверок
    </span>
  )}>
    <Icon type="question-circle-o" />
  </Popover>
)

class NewAdvertiser extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      iconLoading: false,
      data: {
        name: null,
      },
      wallets: [],
      reviseRange: [],
      paymentDate: null,
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('Рекламодатель')
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.state
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data.hasOwnProperty(name)) options.initialValue = data[name]
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label} {name === 'paymentDate' ? paymentDateHelp : null}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      console.log('NewAdvertiser form values', values);
      this.setState({ iconLoading: true })
      const data = { name: values.name }
      api.post(`/v1/advertisers`, qs.stringify(data))
      .then(response => {
        this.setState({ iconLoading: false })
        window.location = `/advertisers`
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  onReviseRangeChange = value => {
    this.setState({ reviseRange: value })
  }

  onPaymentDateChange = value => {
    this.setState({ paymentDate: value })
  }

  disabledDate = current => {
    const { reviseRange } = this.state
    const startRange = reviseRange[0]
    const endRange = moment(reviseRange[1]).add(1, 'days')
    return current && (current.isAfter(startRange) && current.isBefore(endRange))
  }

  render() {
    const { isLoading, iconLoading, reviseRange, paymentDate } = this.state
    const walletsTemp = [
      {
        id: 1407,
        name: 'кошелек 1',
        data: {number: "Z596596954969"},
      },
      {
        id: 1408,
        name: 'кошелек 2',
        data: {number: "Z746593814969"},
      },
    ]
    const _wallets = walletsTemp.map(item => <Select.Option key={item.id} value={item.id}>{item.name} / {item.data && item.data.number}</Select.Option>)

    return (
      <Form>
        <span style={{ color: "#ff2b2b" }}>При создании рекламодателя заполнять только поле "Название", остальной функционал пока не готов!</span>
        <br/>
        <br/>
        <div className="row">
          <div className="col-md-4">
            {this.validator('name', 'Название', <Input size="large" />, [{ required: true }])}
            {this.validator('site', 'Сайт', <Input size="large" />)}
            {this.validator('chat', 'Рабочий чат', <Input size="large" />)}
            {this.validator('contact_name', 'Контактное лицо', <Input size="large" />)}
          </div>
          <div className="col-md-4">
            {this.validator(Manager.data.advertiserManager.field, 'Ответственный менеджер', <Manager.Select managerType="advertiserManager" multiple={false} {...options} /> )}
            {this.validator('wallet_id', 'Кошелёк для выплат', <Select placeholder="Кошелек не выбран" size="large">{_wallets}</Select>, [] )}
            {this.validator('revise_range', 'Интервал сверок', <RangePicker onChange={this.onReviseRangeChange} disabled={!!paymentDate} size="large" style={{ width: "100%" }} />)}
            {this.validator('paymentDate', 'Дата выплат', <DatePicker onChange={this.onPaymentDateChange} disabled={reviseRange.length === 0} disabledDate={this.disabledDate} size="large" />)}
          </div>
        </div>
        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
        </Form.Item>
      </Form>
    )
  }
}

export default Form.create()(NewAdvertiser)
