import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { Form, DatePicker, Table, Icon, Divider, Select, Input, InputNumber, Button, message, Popconfirm, Tooltip, Modal } from 'antd'
import moment from 'moment'
import Helpers, { t } from '../../common/Helpers'
import api from '../../common/Api'
import locale from 'antd/lib/date-picker/locale/ru_RU'
import * as Feather from 'react-feather'
import Add from './Add'
import Consultant from '../Widgets/Consultant'

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
    const statuses = Object.keys(this.props.statuses).map((option, i) => <Select.Option key={i} value={option}>{this.props.statuses[option]}</Select.Option>)
    const sections = Object.keys(this.props.sections).map((option, i) => <Select.Option key={i} value={option}>{this.props.sections[option]}</Select.Option>)
    return (
      <div className="filter filter__tickets">
        <Form onSubmit={this.handleSubmit}>
          {this.validator('created_at', t('field.date'), <DatePicker.RangePicker size="large" format="DD.MM.YYYY"  /> )}
          {this.validator('status', t('field.status'), <Select placeholder={t('field.all')} size="large" allowClear>{statuses}</Select> )}
          {this.validator('section', t('field.section'), <Select placeholder={t('field.all')} size="large" allowClear>{sections}</Select> )}
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

class Tickets extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      filters: {},
      pagination: {
        hideOnSinglePage: true,
      },
      statuses: {},
      sections: {},
      columns: [
        {
          dataIndex: 'created_at',
          render: text => moment.unix(text).format('DD.MM.YYYY (HH:mm)'),
        }, {
          dataIndex: 'section',
          render: (text, row) => {
            const _text = this.state.sections[text]
            return _text || text
          }
        }, {
          dataIndex: 'status',
          render: text => Helpers.renderStatus(text, this.state.statuses),
        }, {
          title: 'Пользователь',
          dataIndex: 'cUser.login',
          render: (text, row) => text && <Link to={`/users/${row.cUser.id}`}>{text}</Link>,
        }, {
          dataIndex: 'title',
          render: (text, row) => (<Link to={`/tickets/${row.id}`}>{text}</Link>)
        }, {
          render: ({ messageCount, unreadMessageCount }) => {
            let unread = null
            if(unreadMessageCount > 0) {
              unread = <strong className="color-green"> +{unreadMessageCount}</strong>
            }
            return <span>{messageCount} {unread}</span>
          },
        }
      ]
    }

    window.addEventListener('tickets.fetch', this.fetch, false)
  }

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination }
    pager.current = pagination.current;
    this.setState({ pagination: pager })
    this.fetch(pagination.current)
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.support')
    this.fetch()

    this.fetchFilters()
    window.addEventListener('CHANGE_LANG', this.fetchFilters, false)
  }

  fetchFilters = () => {
    api.get('/v1/tickets/statuses')
    .then(response => {
      this.setState({ statuses: response.data })
    })

    api.get('/v1/tickets/sections')
    .then(response => {
      this.setState({ sections: response.data })
    })
  }

  fetch = (page = 1) => {
    const { filters } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/tickets', {
      params: {
        sort: '-id',
        page: page,
        expand: 'cUser,rUser',
        ...filters
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

  render() {
    const { data, columns, pagination, sections, statuses, isLoading } = this.state

    columns[0].title = t('field.date')
    columns[1].title = t('field.section')
    columns[2].title = t('field.status')
    columns[4].title = t('field.subject')
    columns[5].title = t('field.messages')

    return (
      <div className="tickets">
          <Filter onSubmit={this.onFilter} statuses={statuses} sections={sections} />
          <Table
            columns={columns}
            rowKey={(item, i) => i}
            dataSource={data}
            pagination={pagination}
            loading={isLoading}
            locale={{ emptyText: Helpers.emptyText }}
            onChange={this.handleTableChange} />

      </div>
    )
  }
}

export default Tickets
