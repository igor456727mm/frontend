import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import { connect } from 'react-redux'
import Helpers, { t, pick } from '../../../common/Helpers'
import api from '../../../common/Api'
import Consultant from '../../Widgets/Consultant'
import Add from './Add'

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
    const _wallets = user.wallets.map(item => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)
    return (
      <div className="filter filter__tickets">
        <Form onSubmit={this.handleSubmit}>
          {this.validator('created_at', t('field.date'), <DatePicker.RangePicker size="large" format="DD.MM.YYYY"  /> )}
          {this.validator('status', t('field.status'), <Select placeholder={t('field.all')} size="large" allowClear>{_statuses}</Select> )}
          {this.validator('wallet_id', t('field.wallet'), <Select placeholder={t('field.all')} size="large" allowClear>{_wallets}</Select> )}
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button htmlType="submit" type="primary" size="large">{t('button.show')}</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = connect((state) => pick(state, 'user'))(Form.create()(_Filter))

class Finance extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      modules: [],
      pagination: {
        hideOnSinglePage: true,
      },
      columns: [
        {
          title: t('field.name'),
          dataIndex: 'name',
        }, {
          title: t('field.type'),
          dataIndex: 'wallet_module_id',
          render: text => this.state.modules[text] && this.state.modules[text].name,
        }, {
          title: t('field.number'),
          dataIndex: 'data.number',
        }
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
    api.get('/v1/wallet-modules')
    .then(response => {
      const modules = {}
      response.data.forEach(item => modules[item.id] = item)
      this.setState({ modules: modules })
    })

    this.fetch()
    window.addEventListener('wallets.fetch', this.fetch, false)
  }

  fetch = (page = 1) => {
    this.setState({ isLoading: true })
    api.get('/v1/wallets', {
      params: {
        sort: '-id',
        page: page,
        expand: 'wallet,module',
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

  render() {
    const { data, columns, pagination, statuses, isLoading, modules } = this.state
    return (
      <div className="profile__payments">
        <Table
          columns={columns}
          rowKey={item => item.id}
          dataSource={data}
          pagination={pagination}
          loading={isLoading}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange} />
          <hr />
          <Add modules={modules} />
      </div>
    )
  }
}

export default Finance
