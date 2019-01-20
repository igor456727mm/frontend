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
          title: 'Сумма',
          dataIndex: 'sum',
          render: (text, row) => text,
        },
        {
          title: 'Кошелек',
          dataIndex: '',
          render: (text, row) => {
            const name = row.wallet && row.wallet.name
            const number = row.wallet && row.wallet.data && row.wallet.data.number
            return number ? `${name} / ${number}` : name
          }
        },
        {
          title: 'Период',
          dataIndex: 'paymentPeriod',
          render: (text, row) => text,
        },
        {
          title: 'Дата поступления',
          dataIndex: 'date',
          render: (text, row) => moment.unix(text).format('DD.MM.YYYY (HH:mm)'),
        },
        {
          title: 'Дней задержки',
          dataIndex: 'days',
          render: (text, row) => text,
        },
      ]
    }
  }

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination }
    pager.current = pagination.current;
    this.setState({ pagination: pager })
    this.fetch(pagination.current)
  }

  componentDidMount = () => {
    this.fetch()
  }

  addPayment = () => {
    this.fetch()
  }

  fetch = (page = 1) => {
    const { filters } = this.state
    const { advertiser_id } = this.props
    // this.setState({ isLoading: true })
    // api.get('/v1/offers', {
    //   params: {
    //     sort: '-id',
    //     page: page,
    //     'per-page': 10,
    //     'q[advertiser_id][equal]': advertiser_id,
    //     expand: 'countries,categories,actions',
    //     ...filters
    //   }
    // })
    // .then(response => {
    //   console.log('get /offers', response.data);
    //   this.setState({
    //     isLoading: false,
    //     data: response.data,
    //     pagination: {
    //       ...this.state.pagination,
    //       total: parseInt(response.headers['x-pagination-total-count'])
    //     }
    //   })
    // })
  }

  render() {
    const { data, columns, pagination, isLoading } = this.state

    return (
      <div className="row">
        <div className="col-md-4">
          <Add addPayment={this.addPayment}/>
        </div>
        <div className="col-md-8">
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
