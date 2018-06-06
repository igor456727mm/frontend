import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import Helpers, { Filters, Events, t, pick, clean } from '../../common/Helpers'
import api from '../../common/Api'

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
    const options = { initialValue: Filters.value(name) }
    return (
      <Form.Item className={`filter__field-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  render() {
    const { statuses, user } = this.props
    const _statuses = Object.keys(statuses).map(item => <Select.Option key={item} value={item}>{statuses[item]}</Select.Option>)
    return (
      <div className="filter filter__tickets">
        <Form onSubmit={this.handleSubmit}>
          {this.validator('created_at', t('field.date'), <DatePicker.RangePicker size="large" format="DD.MM.YYYY"  /> )}
          {this.validator('status', t('field.status'), <Select placeholder={t('field.all')} size="large" allowClear>{_statuses}</Select> )}
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button htmlType="submit" type="primary" size="large">{t('button.show')}</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class Finance extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      filters: Filters.parse(),
      pagination: {
        hideOnSinglePage: true,
      },
      statuses: {},
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          defaultSortOrder: 'descend',
          sorter: true,
        }, {
          title: 'Пользователь',
          dataIndex: 'user.login',
          sorter: true,
          render: (text, row) => row.user && <Link to={`/users/${row.user.id}`} className="link">{text}</Link>
        }, {
          title: 'Дата',
          dataIndex: 'created_at',
          sorter: true,
          render: text => moment.unix(text).format('DD.MM.YYYY (HH:mm)'),
        }, {
          title: 'Сумма',
          dataIndex: 'sum',
          sorter: true,
          render: text => `$${text}`
        }, {
          title: 'Кошелек',
          dataIndex: 'wallet.name',
        }, {
          title: 'Статус',
          dataIndex: 'status',
          sorter: true,
          render: text => Helpers.renderStatus(text, this.state.statuses),
        }
      ]
    }

    window.addEventListener('finance.fetch', this.fetch, false)
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.finance')

    this.fetch()
    Events.follow('finance.fetch', this.fetch)

    api.get('/v1/withdrawals/statuses')
    .then(response => {
      this.setState({ statuses: response.data })
    })
  }

  componentWillUnmount = () => {
    Events.unfollow('finance.fetch', this.fetch)
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/withdrawals', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        ...filters,
        expand: 'wallet,user',
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
    Filters.toUrl(filters)
  }

  handleTableChange = ({ current: page }, filters, { columnKey, order }) => {
    const sort = order == 'ascend' ? columnKey : `-${columnKey}`
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    this.setState({ pagination }, this.fetch)
  }

  onFilter = (values) => {
    const filters = Filters.prepare(values)
    this.setState({ filters }, this.fetch)
  }

  render() {
    const { data, columns, pagination, statuses, isLoading } = this.state
    return (
      <div>
        <Filter onSubmit={this.onFilter} statuses={statuses} />
        <Table
          columns={columns}
          rowKey={item => item.id}
          dataSource={data}
          pagination={pagination}
          loading={isLoading}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange} />
      </div>
    )
  }
}

export default Finance
