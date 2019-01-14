import React, { Component } from 'react'
import { Table } from 'antd'
import moment from 'moment'
import { Link } from 'react-router-dom'
import Helpers, { Filters, pick } from '../../../common/Helpers'
import api from '../../../common/Api'

class ReferralPayouts extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      filters: Filters.parse(),
      data: [],
      pagination: {
        hideOnSinglePage: true,
      },
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          sorter: true,
        },
        {
          title: 'Дата создания',
          dataIndex: 'created_at',
          render: text => moment.unix(text).format('DD.MM.YYYY (HH:mm)'),
          sorter: true,
        },
        {
          title: 'Сумма',
          dataIndex: 'sum',
          render: (text, row) => {
            const currency ='$'
            return `${text} ${currency}`
          },
        },
        {
          title: 'Статус',
          dataIndex: 'status',
          render: (text, row) => {
            return Helpers.renderStatusRef(text)
          },
        },
        {
          title: 'Комментарий',
          dataIndex: 'comment',
          render: (text, row) => {
            return text
          },
        },
      ]
    }
  }

  componentDidMount = () => {
    this.fetch()
  }

  fetch = () => {
    const { filters, pagination } = this.state
    const { user_id } = this.props
    this.setState({ isLoading: true })
    api.get('/v1/referral-withdrawals', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        ...filters,
        'q[user_id][equal]': user_id,
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
    .catch(e => Helpers.errorHandler(e))
    Filters.toUrl(filters)
  }

  handleTableChange = ({ current: page }, filters, { columnKey, order }) => {
    const sort = (order && columnKey) && (order == 'ascend' ? columnKey : `-${columnKey}`)
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    this.setState({ pagination }, this.fetch)
  }

  onFilter = (values) => {
    const filters = Filters.prepare(values)
    this.setState({ filters }, this.fetch)
  }

  render() {
    const props = pick(this.state, 'data:dataSource', 'columns', 'pagination', 'isLoading:loading')
    return (
      <Table
        className="app__table"
        rowKey={(item, i) => `${item.user_id}${item.offer_id}${i}`}
        locale={{ emptyText: Helpers.emptyText }}
        onChange={this.handleTableChange}
        {...props}
        />
    )
  }
}

export default ReferralPayouts
