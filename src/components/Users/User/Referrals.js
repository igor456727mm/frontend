import React, { Component } from 'react'
import { Form, Table, Button, message } from 'antd'
import { connect } from 'react-redux'
import qs from 'qs'
import Helpers, { Events, t, pick, clean, MonthsPicker } from '../../../common/Helpers'
import api from '../../../common/Api'
import WithdrawReferral from './WithdrawReferral'
import ReferralPayouts from './ReferralPayouts'

class _Filter extends Component {

  constructor(props) {
    super(props)
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      this.props.onSubmit(clean(values))
    })
  }

  validator = (name, label, input) => {
    const { getFieldDecorator } = this.props.form
    const options = { }
    return (
      <Form.Item className={`filter__field-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  render() {
    return (
      <div className="filter filter__referrals">
        <Form>
          {this.validator('created_at', t('field.date'), <MonthsPicker /> )}
          <Form.Item style={{ marginLeft: 0 }} >
            <h4>&nbsp;</h4>
            <Button onClick={this.handleSubmit} htmlType="submit" type="primary" size="large">{t('button.show')}</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class Referrals extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      filters: {},
      isLoading: false,
      isGettingPayout: false,
      referralBalance: '',
      referralHold: '',
      pagination: {
        hideOnSinglePage: true,
      },
      columns: [
        {
          title: 'Месяц',
          dataIndex: 'name',
        },
        {
          title: 'Кол-во вебмастеров',
          dataIndex: 'usersCount',
          render: (text, row, key) => {
            return text
          },
        },
        {
          title: 'В холде',
          dataIndex: 'hold',
        },
        {
          title: 'Заработано',
          dataIndex: 'income',
        }
      ]
    }
  }

  componentDidMount = () => {
    const { user_id } = this.props
    Helpers.setTitle('menu.referrals')
    this.fetch()
    api.get(`/v1/user-data/${user_id}`, {
      params: {
        expand: 'referralBalance,referralHold',
      }
    })
    .then(response => {
      this.setState({
        referralBalance: response.data.referralBalance,
        referralHold: response.data.referralHold,
      })
    })
  }

  fetch = () => {
    const { filters, pagination } = this.state
    const { user_id } = this.props
    this.setState({ isLoading: true })
    api.get('/v1/referrals/stats', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        ...filters,
        userId: user_id,
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

  prepareQueryParams = (values) => {
    const skip = ['group']
    const filters = {}
    const keys = Object.keys(values)
    if(!keys.length) return filters
    keys.forEach(key => {
      const val = values[key]
      const isArray = Array.isArray(val)
      if(!val || skip.includes(key) || isArray && !val.length) return
      if(isArray) {
        if(['created_at', 'date'].includes(key)) {
          const start = val[0] && val[0].startOf('day').unix()
          const end = val[1] && val[1].endOf('day').unix()
          if(start && end) {
            filters.startDate = start
            filters.endDate = end
          }
        } else {
          switch (key) {
            case 'advertiser_id':
              filters.advertiserId = val.join(',')
              break;
            case 'offer_id':
              filters.offerIds = val.join(',')
              break;
            default:
              filters[key] = val.join(',')
          }
        }
      } else {
        switch (key) {
          case 'advertiser_id':
            filters.advertiserId = val
            break;
          case 'offer_id':
            filters.offerIds = val
            break;
          default:
            filters[key] = val
        }
      }
    })
    return filters
  }

  onFilter = (values) => {
    const filters = this.prepareQueryParams(values)
    this.setState({ filters }, this.fetch)
  }

  handleTableChange = ({ current: page }, filters, { columnKey, order }) => {
    const sort = order == 'ascend' ? columnKey : `-${columnKey}`
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    this.setState({ pagination }, this.fetch)
  }

  onOrderPayout = () => {
    this.setState({ isGettingPayout: true })
    const { user_id } = this.props
    const { referralBalance } = this.state
    const data = {
      currency_id: 1,
      user_id,
      sum: referralBalance,
    }
    api.post(`/v1/referral-withdrawals`, qs.stringify(data))
    .then(response => {
      this.setState({ isGettingPayout: false })
      message.success('Выплата заказана.')
    })
    .catch(e => {
      this.setState({ isGettingPayout: false })
      Helpers.errorHandler(e)
    })
  }

  render() {
    const { data, columns, pagination, isLoading, referralBalance, isGettingPayout, referralHold } = this.state
    const { user_id } = this.props
    return (
      <div>
        <Filter onSubmit={this.onFilter} />
        <div className="referralBalance">
          <span className="referralBalance__balance">
            Реферальный баланс: { referralBalance ? referralBalance : 0 }
          </span>
          <Button onClick={this.onOrderPayout} loading={isGettingPayout} className="referralBalance__button" htmlType="submit" type="primary" size="large">Заказать выплату</Button>
        </div>
        <Table
          className="app__table"
          columns={columns}
          rowKey={(item, i) => i}
          dataSource={data}
          pagination={pagination}
          loading={Helpers.controlledSpinner('table', isLoading)}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange}
        />
        <div className="referralBalance__referralWithdrawals">
          <h2 className="referralBalance__title">Реферальный баланс: { referralBalance ? referralBalance : 0 }$ / Реферальный холд: { referralHold ? referralHold : 0 }$</h2>
          <WithdrawReferral user_id={user_id} balance={referralBalance} />
        </div>
        <div className="referralBalance__payouts">
          <h2>Выплаты</h2>
          <ReferralPayouts user_id={user_id} />
        </div>
      </div>
    )
  }
}

export default connect((state) => pick(state, 'config', 'user'))(Form.create()(Referrals))
