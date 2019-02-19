import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import Cookies from 'js-cookie'
import { Link } from 'react-router-dom'
import Helpers, { Filters, Events, t, pick, clean, disabledDate } from '../../common/Helpers'
import SearchSelect from '../../common/Helpers/SearchSelect'
import api from '../../common/Api'
import * as Feather from 'react-feather'

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

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
    // const options = { initialValue: Filters.value(name) }
    const options = {  }
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
          {this.validator('user_id', 'Пользователь', <SearchSelect target="users" {...options} /> )}
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

class OfferRequests extends Component {

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
          title: 'Дата создания',
          dataIndex: 'created_at',
          sorter: true,
          defaultSortOrder: 'descend',
          render: (text, { created_at }) => created_at && moment.unix(created_at).format('DD.MM.YY HH:mm'),
        },
        {
          title: 'Оффер (id)',
          dataIndex: 'offer_id',
          sorter: true,
          render: (text, row) => <Link to={`/offers/${text}`}>{text}</Link>,
        },
        {
          title: 'Пользователь',
          dataIndex: 'user_id',
          render: (text, row) => <Link to={`/users/${text}`}>{`${row.user.name}`}</Link>,
        },
        {
          title: 'Комментарий',
          dataIndex: 'comment',
        },
        {
          title: 'Разрешить доступ',
          dataIndex: '',
          render: (text, row) => <Button  onClick={this.onConfirm(row.offer_id, row.user_id, row.user.name)} style={{ padding: '5px 10px'}}><Feather.CheckCircle /></Button>,
        },
      ]
    }
  }

  componentDidMount = () => {
    this.fetch()
  }

  onConfirm = (offer_id, user_id, userName) => () => {
    const key = `${user_id},${offer_id}`
    const data = {
      user_id,
      offer_id,
      have_access: 1,
    }

    api.post(`/v1/user-offer-individual-conditions`, qs.stringify(data))
    .then(response => {
      message.success(`Доступ к офферу #${offer_id} для пользователя ${userName} разрешен`)
      return api.delete(`/v1/access-requests/${key}`)
    })
    .then(response => {
      this.fetch()
    })
    .catch(e => Helpers.errorHandler(e))
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/access-requests', {
      params: {
        sort: pagination.sort || '-created_at',
        page: pagination.current || 1,
        ...filters,
        expand: 'user',
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
      <div>
        <Filter onSubmit={this.onFilter} />
        <Table
          rowKey={(item, i) => `${item.user_id}${item.offer_id}${i}`}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange}
          {...props}
          />
      </div>
    )
  }
}

export default OfferRequests
