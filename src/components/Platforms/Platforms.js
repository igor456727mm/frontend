import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message, Popconfirm } from 'antd'
import moment from 'moment'
import { Link } from 'react-router-dom'
import Helpers, { Filters, Events, t, pick, clean } from '../../common/Helpers'
import api from '../../common/Api'
import Consultant from '../Widgets/Consultant'
import _Form from './Form.js'

const Icons = {}

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
    const { statuses, types } = this.props
    const _statuses = Object.keys(statuses).map(item => <Select.Option key={item} value={item}>{statuses[item]}</Select.Option>)
    const _types = Object.keys(types).map(item => <Select.Option key={item} value={item}>{types[item]}</Select.Option>)
    return (
      <div className="filter filter__tickets">
        <Form onSubmit={this.handleSubmit}>
          {this.validator('status', t('field.status'), <Select placeholder={t('field.all')} size="large" allowClear>{_statuses}</Select> )}
          {this.validator('type', t('field.type'), <Select placeholder={t('field.all')} size="large" allowClear>{_types}</Select> )}
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

class Platforms extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      filters: Filters.parse(),
      pagination: {
        hideOnSinglePage: true,
      },
      statuses: {},
      types: {},
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
          title: 'Название',
          dataIndex: 'name',
          sorter: true,
        }, {
          title: 'Тип',
          dataIndex: 'type',
          sorter: true,
          render: text => this.state.types[text]
        }, {
          title: 'URL',
          dataIndex: 'url',
          render: text => text && <a href={text} target="_blank">{text}</a>
        }, {
          title: 'Статус',
          dataIndex: 'status',
          sorter: true,
          render: text => Helpers.renderStatus(text, this.state.statuses),
        }, {
          width: 150,
          render: (text, row) => (
            <div className="table__actions">
              <_Form data={row} types={this.state.types} />
              <Popconfirm onConfirm={() => this._onDelete(row)} title={t('delete.confirm')} okText={t('delete.ok')} cancelText={t('delete.cancel')}>
                <span className="table__actions-delete">Удалить</span>
              </Popconfirm>
            </div>
          )
        }
      ]
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.platforms')

    this.fetch()
    Events.follow('platforms.fetch', this.fetch)

    api.get('/v1/platforms/statuses')
    .then(response => {
      this.setState({ statuses: response.data })
    })

    api.get('/v1/platforms/types')
    .then(response => {
      this.setState({ types: response.data })
    })
  }

  componentWillUnmount = () => {
    Events.unfollow('platforms.fetch', this.fetch)
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/platforms', {
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
    const sort = (order && columnKey) && (order == 'ascend' ? columnKey : `-${columnKey}`)
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    this.setState({ pagination }, this.fetch)
  }

  onFilter = (values) => {
    const filters = Filters.prepare(values)
    this.setState({ filters }, this.fetch)
  }

  _onDelete = (row) => {
    api.delete(`/v1/platforms/${row.id}`)
    .then(response => {
      message.success(`Площадка "${row.name}" удалена`)
      this.fetch(this.state.pagination.current)
    })
    .catch(e => Helpers.errorHandler(e))
  }


  render() {
    const { data, columns, pagination, isLoading } = this.state

    return (
      <div>
        <Filter onSubmit={this.onFilter} {...pick(this.state, 'statuses', 'types' )} />
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

export default Platforms
