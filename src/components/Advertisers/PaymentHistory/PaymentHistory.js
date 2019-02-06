import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message, Popover } from 'antd'
import moment from 'moment'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Helpers, { t, pick, TreeSelectRemote } from '../../../common/Helpers'
import api from '../../../common/Api'
import styles from '../Advertisers.module.sass'
import Add from './Add'

class PaymentHistory extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      pagination: {
        hideOnSinglePage: true,
        pageSize: 10,
      },
      columns: [
        {
          title: 'Дата создания',
          dataIndex: 'createdAt',
          sorter: true,
          render: text => moment.unix(text).format('DD.MM.YYYY HH:mm'),
        },
        {
          title: 'Сумма',
          dataIndex: 'sum',
          render: (text, row) => {
            const currency ='$'
            return `${Number(text).toFixed(2)}${currency}`
          },
        },
        {
          title: 'Кошелек',
          dataIndex: '',
          render: (text, row) => {
            // console.log('row', row);
            const wallet = this.props.wallets.find(el => String(el.id) === String(row.walletId))
            // console.log('wallet', wallet);
            const name = wallet && wallet.name
            const number = wallet && wallet.data && wallet.data.number
            return number ? `${name} / ${number}` : name
          }
        },
        {
          title: 'Платежный период',
          dataIndex: 'paymentPeriod',
          render: (text, row) => {
            if (!text) {
              return null
            }
            const { startDate, endDate } = text
            const fromDate = startDate && moment.unix(startDate).format('DD.MM.YYYY')
            const toDate = endDate && moment.unix(endDate).format('DD.MM.YYYY')
            return `${fromDate} - ${toDate}`
          },
        },
        {
          title: 'Дата оплаты',
          dataIndex: '',
          render: (text, row) => row.data && row.data.date && moment.unix(row.data.date).format('DD.MM.YYYY') || '',
        },
        {
          title: 'Дней задержки',
          dataIndex: 'overdue',
          render: (text, row) => {
            if (text === null) {
              return null
            }
            if (text === 0) {
              return text
            }
            return Math.ceil(moment.duration(text, 'seconds').asDays())
          },
        },
        {
          title: 'Комментарий',
          dataIndex: '',
          render: (text, row) => row.data && row.data.comment,
        },
      ]
    }
  }

  // handleTableChange = (pagination, filters, sorter) => {
  //   const pager = { ...this.state.pagination }
  //   pager.current = pagination.current;
  //   this.setState({ pagination: pager })
  //   this.fetch(pagination.current)
  // }

  handleTableChange = ({ current: page }, filters, { columnKey, order }) => {
    const sort = (order && columnKey) && (order == 'ascend' ? columnKey : `-${columnKey}`)
    console.log('sort !!', sort);
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    console.log('pagination !!', pagination);
    this.setState({ pagination }, this.fetch)
  }

  componentDidMount = () => {
    this.fetch()
  }

  updatePayment = () => {
    this.fetch()
  }

  fetch = (page = 1) => {
    const { filters, pagination } = this.state
    const { advertiser_id } = this.props
    this.setState({ isLoading: true })
    console.log('filters', filters, pagination);
    api.get('/finances/withdrawals', {
      params: {
        sort: pagination.sort || '-id',
        page: page,
        'per-page': pagination.pageSize,
        'q[advertiserId][equal]': advertiser_id,
        ...filters,
        expand: 'overdue,paymentPeriod',
      }
    })
    .then(response => {
      console.log('get PaymentHistory response', response.data);
      this.setState({
        isLoading: false,
        data: response.data,
        pagination: {
          ...pagination,
          total: parseInt(response.headers['x-pagination-total-count'])
        }
      })
    })
  }

  render() {
    const { data, columns, pagination, isLoading } = this.state
    const { wallets=[] } = this.props

    return (
      <div className="row">
        <div className="col-md-3">
          <Add wallets={wallets} updatePayment={this.updatePayment}/>
        </div>
        <div className="col-md-9">
          <Table
            className={styles.table}
            columns={columns}
            rowKey={item => item.id}
            dataSource={data}
            pagination={pagination}
            loading={isLoading}
            locale={{ emptyText: Helpers.emptyText }}
            onChange={this.handleTableChange}
          />
        </div>
      </div>
    )
  }
}

export default PaymentHistory
