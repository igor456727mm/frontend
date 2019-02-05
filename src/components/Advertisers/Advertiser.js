import React, { Component } from 'react'
import { Form, Table, Select, Input, InputNumber, DatePicker, Button, message, Upload, Icon, Checkbox, Modal, Popconfirm, Tabs, Popover } from 'antd'
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
import Wallets from './Wallets/Wallets'
import * as Manager from '../../common/Helpers/ManagerSelect'
import OffersShort from './OffersShort'
import RevisesShort from './RevisesShort'
import PaymentHistory from './PaymentHistory/PaymentHistory'
import styles from './Advertisers.module.sass'

const { TabPane } = Tabs
const { RangePicker } = DatePicker

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

const paymentDateHelp = (
  <Popover placement="right" content={(
    <span>
      Сначала укажите интервал сверок
    </span>
  )}>
    <Icon type="question-circle-o" />
  </Popover>
)

class Advertiser extends Component {

  constructor(props) {
    super(props)
    const { id } = props.match.params
    this.state = {
      isNew: id == 'new',
      isLoading: false,
      iconLoading: false,
      data: {
        id: id,
        name: null,
      },
      wallets: [],
      paymentPeriod: [],
      paymentPeriodPay: null,
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('Рекламодатель')
    this.fetch()
    this.getWallets()
  }

  fetch = () => {
    const { id } = this.state.data
    const { isNew } = this.state
    this.setState({ isLoading: true })
    if(!isNew) {
      api.get(`/v1/advertisers/${id}`, {
        params: {
          expand: 'uuid,hold,balance,data',
        }
      })
      .then(response => {
        console.log('advertiser get', response.data);
        const { data } = response
        const paymentPeriod = (data.data && data.data.paymentPeriodStart && data.data.paymentPeriodEnd) ?
          [moment.unix(data.data.paymentPeriodStart), moment.unix(data.data.paymentPeriodEnd)] : []
        const paymentPeriodPay = data.data && data.data.paymentPeriodPay || null
        this.setState({
          isLoading: false,
          data,
          paymentPeriod,
          paymentPeriodPay,
         })
      })
      .catch(e => {
        this.setState({ isLoading: false })
        Helpers.errorHandler(e)
      })
    } else {
      this.setState({ isLoading: false })
    }
  }

  getWallets = () => {
    const { id } = this.state.data
    this.setState({ isLoading: true })
    api.get('/v1/finances/wallets', {
      params: {
        'q[advertiserId][equal]': id,
        sort: '-id',
      }
    })
    .then(response => {
      console.log('advertiser wallets response', response.data);
      this.setState({
        isLoading: false,
        wallets: response.data,
      })
    })
    .catch(Helpers.errorHandler)
  }

  updateWallets = (values) => {
    const { id, uuid } = this.state.data
    const { name, wallet_id } = values
    console.log('this.state', this.state);
    console.log('updateWallets values', values);
    const data = {
      name: values.name,
      ownerId: uuid,
      walletModuleId: values.walletModuleId,
      data: {
        number: values.number
      }
    }
    this.setState({ iconLoading: true })
    api.post(`/v1/finances/wallets`, qs.stringify(data))
    .then(response => {
      this.setState({ iconLoading: false })
      message.success(t('Кошелек добавлен'))
      this.getWallets()
    })
    .catch(e => {
      this.setState({ iconLoading: false })
      Helpers.errorHandler(e)
    })
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.state
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if (data.hasOwnProperty(name) || name === 'paymentPeriod' || (data.data && data.data.hasOwnProperty(name))) {
      switch (name) {
        case 'name':
          options.initialValue = data[name]
          break;
        case 'advertiser_manager_id':
          if (data[name]) {
            // console.log('data[name]', data[name]);
            options.initialValue = String(data[name])
          }
          break;
        case 'contactName':
          options.initialValue = data.data[name]
          break;
        case 'chat':
          options.initialValue = data.data[name]
          break;
        case 'homepage':
          options.initialValue = data.data[name]
          break;
        case 'paymentPeriod':
          if (data.data && data.data.paymentPeriodStart && data.data.paymentPeriodEnd) {
            options.initialValue = [moment.unix(data.data.paymentPeriodStart), moment.unix(data.data.paymentPeriodEnd)]
          }
          break;
        case 'paymentPeriodPay':
          if (data.data && data.data.paymentPeriodPay !== 0) {
            options.initialValue = moment.unix(data.data.paymentPeriodPay)
          }
          break;
        default:
          options.initialValue = data[name]
      }
    }
    // console.log('options', options);
    // if(data.hasOwnProperty(name)) options.initialValue = data[name]
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label} {name === 'paymentPeriodPay' ? paymentDateHelp : null}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  getData = values => {
    const data = {
      name: values.name,
      advertiser_manager_id: values.advertiser_manager_id,
      data: {
        paymentPeriodStart: values.paymentPeriod && Array.isArray(values.paymentPeriod) && values.paymentPeriod[0].unix() || null,
        paymentPeriodEnd: values.paymentPeriod && Array.isArray(values.paymentPeriod) && values.paymentPeriod[1].unix() || null,
        paymentPeriodPay: values.paymentPeriodPay && values.paymentPeriodPay.unix() || null,
        contactName: values.contactName,
        chat: values.chat,
        homepage: values.homepage,
      },
    }
    return data
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { data, isNew } = this.state
    const { form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return

      this.setState({ iconLoading: true })
      if(isNew) {
        api.post(`/v1/advertisers`, qs.stringify(this.getData(values)))
        .then(response => {
          this.setState({ iconLoading: false })
          window.location = `/advertisers`
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        // console.log('Advertiser patch form values', this.getData(values));
        api.patch(`/v1/advertisers/${data.id}`, qs.stringify(this.getData(values)))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(`Рекламодатель ${data.name} сохранен`)
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }

    })
  }

  _onDelete = () => {
    const { data } = this.state
    api.delete(`/v1/advertisers/${data.id}`)
    .then(response => {
      message.success(`Рекламодатель ${data.name} удален`)
      window.location = `/advertisers`
    })
    .catch(e => {
      Helpers.errorHandler(e)
    })
  }

  onPaymentPeriodChange = value => {
    this.setState({ paymentPeriod: value })
  }

  onPaymentDateChange = value => {
    this.setState({ paymentPeriodPay: value })
  }

  disabledDate = current => {
    const { paymentPeriod } = this.state
    const startRange = paymentPeriod[0]
    const endRange = moment(paymentPeriod[1]).add(1, 'days')
    return current && current.isBefore(endRange)
  }

  render() {
    const { isLoading, iconLoading, isNew, paymentPeriod, paymentPeriodPay, data, wallets } = this.state

    return (
      <div className="advertiser">
        <Tabs type="card">
          <TabPane tab="Рекламодатель" key="1">
            <Form>
              <div className="row">
                <div className="col-md-4">
                  {this.validator('name', 'Название', <Input size="large" />, [{ required: true }])}
                  {this.validator('homepage', 'Сайт', <Input size="large" />)}
                  {this.validator('chat', 'Рабочий чат', <Input size="large" />)}
                  {this.validator('contactName', 'Контактное лицо', <Input size="large" />)}
                </div>
                <div className="col-md-4">
                  {this.validator('advertiser_manager_id', 'Ответственный менеджер', <Manager.Select managerType="advertiserManager" multiple={false} {...options} /> )}
                  {this.validator('paymentPeriod', 'Интервал сверок', <RangePicker onChange={this.onPaymentPeriodChange} disabled={!!paymentPeriodPay} size="large" style={{ width: "100%" }} />)}
                  {this.validator('paymentPeriodPay', 'Дата выплат', <DatePicker onChange={this.onPaymentDateChange} disabled={paymentPeriod.length === 0} disabledDate={this.disabledDate} size="large" />)}
                </div>
                <div className="col-md-4">
                  <div className={styles.balance}>
                    <span className={styles.balance__title}>Баланс: </span>
                    <span className={styles.balance__data}>{`${data.hold}$`} холд / {`${data.balance}$`} баланс</span>
                  </div>
                </div>
              </div>
              <div className="flex">
                <Form.Item>
                  <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
                </Form.Item>

                {!isNew &&
                  <Form.Item>
                    <Popconfirm title="Удалить рекламодателя?" onConfirm={this._onDelete} okText="Да" cancelText="Нет">
                      <Button type="danger" htmlType="button" size="large" style={{ marginLeft: '24px' }}>Удалить</Button>
                    </Popconfirm>
                  </Form.Item>
                }
              </div>
            </Form>
          </TabPane>
          <TabPane tab="Платежные данные" key="2">
            <Wallets wallets={wallets} getWallets={this.getWallets} updateWallets={this.updateWallets} advertiser_id={data.id} />
          </TabPane>
          <TabPane tab="Список офферов" key="3">
            <OffersShort advertiser_id={data.id} />
          </TabPane>
          <TabPane tab="Сверки" key="4">
            <RevisesShort advertiser_id={data.id} />
          </TabPane>
          <TabPane tab="История оплат" key="5">
            <PaymentHistory wallets={wallets} advertiser_id={data.id} />
          </TabPane>
        </Tabs>
      </div>
    )

  }
}

export default Form.create()(Advertiser)
