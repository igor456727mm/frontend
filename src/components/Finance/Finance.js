import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import Helpers, { t, pick, queryParams, parseQueryFiltersValues, disabledDate } from '../../common/Helpers'
import api from '../../common/Api'
import SearchSelect from '../../common/Helpers/SearchSelect'

class _Filter extends Component {

  constructor(props) {
    super(props)
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      Object.keys(values).forEach(key => (values[key] === undefined || !values[key]) && delete values[key])
      this.props.onSubmit(values)
    })
  }

  validator = (name, label, input) => {
    const { getFieldDecorator } = this.props.form
    const options = { }
    const _value = parseQueryFiltersValues(name)
    if(_value) options.initialValue = _value
    return (
      <Form.Item className={`filter__field-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  render() {
    const { statuses } = this.props
    const _statuses = Object.keys(statuses).map(item => <Select.Option key={item} value={item}>{statuses[item]}</Select.Option>)
    return (
      <div className="filter filter__withdrawals block">
        <Form>
          {this.validator('created_at', t('field.date'), <DatePicker.RangePicker disabledDate={disabledDate} size="large" format="DD.MM.YYYY"  /> )}
          {this.validator('user_id', 'Пользователь', <SearchSelect target="/v1/users" /> )}
          {this.validator('status', t('field.status'), <Select placeholder={t('field.all')} size="large" allowClear>{_statuses}</Select> )}
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button onClick={this.handleSubmit} type="primary" htmlType="submit" size="large">{t('button.show')}</Button>
          </Form.Item>
          <Form.Item>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class Withdrawals extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      filters: queryParams(),
      pagination: {
        hideOnSinglePage: true,
      },
      statuses: {},
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          sorter: true,
        }, {
          title: 'Пользователь',
          dataIndex: 'user.login',
          render: (text, row) => row.user && <Link to={`/users/${row.user.id}`} className="link">{text}</Link> || row.user_id
        }, {
          dataIndex: 'created_at',
          render: text => moment.unix(text).format('DD.MM.YYYY (HH:mm)'),
          sorter: true,
        }, {
          dataIndex: 'sum',
          render: (text, row) => {
            const currency ='$'
            return `${text} ${currency}`
          },
          sorter: true,
        }, {
          dataIndex: 'status',
          render: text => Helpers.renderStatus(text, this.state.statuses),
          sorter: true,
        }, {
          dataIndex: 'wallet.name',
          sorter: true,
          render: (text, row) => {
            const number = row.wallet && row.wallet.data && row.wallet.data.number
            return number ? `${text} / ${number}` : text
          }
        }, {
          title: 'Комментарий вебмастеру',
          dataIndex: 'webmaster_comment',
        }, {
          width: 280,
          render: (text, row) => {
            if(row.status !== 'pending') return null
            return (
              <div className="table__actions">
                <span><Button onClick={() => this._onConfirmed(row.id)}>Подтвердить</Button></span>
                <span><Button type="danger" onClick={() => this._onRejected(row.id)}>X</Button></span>
              </div>
            )
          }
        }
      ]
    }
  }

  handleTableChange = ({ current }, filters, { columnKey, order }) => {
    this.setState({
      pagination: {
        ...this.state.pagination,
        current: current,
      }
    })
    this.fetch(current, {
      sort: order == 'ascend' ? columnKey : `-${columnKey}`
    })
  }

  componentDidMount = () => {
    this.fetch()
    window.addEventListener('finance.fetch', this.fetch, false)

    api.get('/v1/withdrawals/statuses')
    .then(response => {
      this.setState({ statuses: response.data })
    })
  }

  fetch = (page = 1, options = {}) => {
    const { filters, columns } = this.state
    if(!options.sort) options.sort = `-${columns[0].dataIndex}`
    this.setState({ isLoading: true })
    api.get('/v1/withdrawals', {
      params: {
        page: page,
        expand: 'wallet,user',
        ...filters,
        ...options
      }
    })
    .then(response => {
      this.setState({
        isLoading: false,
        data: response.data,
        pagination: {
          ...this.state.pagination,
          total: parseInt(response.headers['x-pagination-total-count'])
        }
      })
    })
  }

  onFilter = (values) => {
    const filters = {}
    const keys = Object.keys(values)
    if(keys) {
      keys.forEach(key => {
        const val = values[key]
        if(!val || Array.isArray(val) && !val.length) return
        switch (key) {
          case 'created_at':
            const start = val[0] && val[0].startOf('day').unix()
            const end = val[1] && val[1].endOf('day').unix()
            if(start && end) filters[`q[${key}][between]`] = `${start},${end}`
            break;
          default:
            filters[`q[${key}][equal]`] = val
        }
      })
    }
    this.setState({ filters: filters}, this.fetch)
  }

  _onConfirmed = (id) => {
    api.patch(`/v1/withdrawals/${id}`, qs.stringify({ status: 'confirmed', currency_id: 1 }))
    .then(response => {
      message.success(`Выплата подтверждена`)
      this.fetch()
    })
    .catch(Helpers.errorHandler)
  }

  _onRejected = (id) => {
    api.patch(`/v1/withdrawals/${id}`, qs.stringify({ status: 'rejected', currency_id: 1 }))
    .then(response => {
      this.fetch()
    })
    .catch(Helpers.errorHandler)
  }

  render() {
    const { data, columns, pagination, statuses, isLoading } = this.state

    columns[2].title = t('field.date')
    columns[3].title = t('field.sum')
    columns[4].title = t('field.status')
    columns[5].title = t('field.wallet')

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

export default Withdrawals
