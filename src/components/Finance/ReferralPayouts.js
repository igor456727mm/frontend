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
          title: 'Пользователь',
          dataIndex: 'user_id',
          render: (text, row) => {
            return <Link to={`/users/${text}`}>{`${text}`}</Link>
          },
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
          sorter: true,
        },
        {
          title: 'Статус',
          dataIndex: 'status',
          render: (text, row) => {
            return Helpers.renderStatusRef(text)
          },
          sorter: true,
        },
        {
          title: 'Комментарий',
          dataIndex: 'comment',
          render: (text, row) => {
            return text
          },
        },
        {
          title: 'Подтверждение выплат',
          width: 280,
          render: (text, row) => {
            if(row.status !== 'waiting') return null
            return (
              <div className="table__actions">
                <span><Button onClick={() => this._onConfirmed(row.id, row.sum)}>Подтвердить</Button></span>
              </div>
            )
          }
        }
      ]
    }
  }

  componentDidMount = () => {
    this.fetch()
  }

  _onConfirmed = (id, sum) => {
    api.patch(`/v1/referral-withdrawals/${id}`, qs.stringify({ status: 'success', sum }))
    .then(response => {
      message.success(`Выплата подтверждена`)
      this.fetch()
    })
    .catch(Helpers.errorHandler)
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/referral-withdrawals', {
      params: {
        sort: pagination.sort || '-id',
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
          className="app__table"
          rowKey={(item, i) => `${item.user_id}${item.offer_id}${i}`}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange}
          {...props}
          />
      </div>
    )
  }
}

export default ReferralPayouts
