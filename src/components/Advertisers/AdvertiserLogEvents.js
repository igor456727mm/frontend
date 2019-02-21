import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import Cookies from 'js-cookie'
import { Link } from 'react-router-dom'
import Helpers, { Filters, Events, t, pick, clean, disabledDate } from '../../common/Helpers'
import api from '../../common/Api'
import * as Feather from 'react-feather'

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
      <div className="filter">
        <Form>
          {this.validator('id', 'Id', <Input size="large" /> )}
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button onClick={this.handleSubmit} type="primary" htmlType="submit" size="large">{t('button.show')}</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class EventsLog extends Component {

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
          title: 'Id',
          dataIndex: 'id',
          render: (text, row) => text,
        },
        {
          title: 'Дата создания',
          dataIndex: 'created_at',
          sorter: true,
          defaultSortOrder: 'descend',
          render: text => moment.unix(text).format('DD.MM.YYYY HH:mm'),
        },
        {
          title: 'Заголовок',
          dataIndex: 'title',
          sorter: true,
          render: (text, row) => {
            return text
          },
        },
        {
          title: 'Событие',
          dataIndex: 'text',
          render: (text, row) => {
            return text
          },
        },
        {
          title: 'Прочитано',
          dataIndex: '',
          render: (text, row) => <Button onClick={this.onConfirm(row.id)} style={{ padding: '5px 10px'}}><Feather.CheckCircle /></Button>,
        },
      ]
    }
  }

  componentDidMount = () => {
    this.fetch()
  }

  fetch = () => {
    const { filters, pagination } = this.state
    const { advertiser_id } = this.props
    this.setState({ isLoading: true })

    api.get(`/v1/advertiser-events?q[advertiser_id][equal]=${advertiser_id}`, {
      params: {
        sort: pagination.sort || '-created_at',
        page: pagination.current || 1,
        ...filters,
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
    .catch(e => {
      this.setState({ isLoading: false })
      Helpers.errorHandler(e)
    })
  }

  onConfirm = eventId => () => {

    api.delete(`/v1/advertiser-events/${eventId}`)
    .then(response => {
      message.success(`Событие прочитано`)
      this.fetch()
    })
    .catch(e => Helpers.errorHandler(e))
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
    const { isLoading } = this.state
    const props = pick(this.state, 'data:dataSource', 'columns', 'pagination', 'isLoading:loading')
    return (
      <div>
        <Filter onSubmit={this.onFilter} />
        <Table
          className="app__table"
          rowKey={item => item.id}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange}
          {...props}
          />
      </div>
    )
  }
}

export default EventsLog
