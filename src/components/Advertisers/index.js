import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import Cookies from 'js-cookie'
import { Link } from 'react-router-dom'
import Helpers, { Filters, Events, t, pick, clean, disabledDate } from '../../common/Helpers'
import api from '../../common/Api'
import * as Manager from '../../common/Helpers/ManagerSelect'
import ChangingManager from '../../common/ChangingManager'

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
    return (
      <div className="filter">
        <Form>
          {this.validator('name', t('field.name'), <Input size="large" /> )}
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button onClick={this.handleSubmit} type="primary" htmlType="submit" size="large">{t('button.show')}</Button>
          </Form.Item>
          <Form.Item>
            <h4>&nbsp;</h4>
            <Link className="ant-btn ant-btn-lg" to="/advertisers/new">Добавить рекламодателя</Link>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class Advertiser extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      filters: Filters.parse(),
      data: [],
      advertiserManagers: [],
      pagination: {
        hideOnSinglePage: true,
      },
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          sorter: true,
          defaultSortOrder: 'descend',
        },
        {
          title: 'Дата создания',
          dataIndex: 'created_at',
          sorter: true,
          render: text => moment.unix(text).format('DD.MM.YYYY HH:mm'),
        },
        {
          title: 'Название',
          dataIndex: 'name',
          sorter: true,
          render: (text, row) => {
            return <Link to={`/advertisers/${row.id}`}>{text}</Link>
          },
        },
        {
          title: 'Холд',
          dataIndex: '',
          render: (text, row) => {
            return row.hold ? `${row.hold}$` : null
          },
        },
        {
          title: 'Баланс',
          dataIndex: '',
          render: (text, row) => {
            return row.balance ? `${row.balance}$` : null
          },
        },
        {
          title: 'Не получена выплата (дней)',
          dataIndex: 'paymentOverdue',
          render: (text, row) => {
            if (text === null) {
              return null
            }
            if (text === 0) {
              return text
            }
            return Math.ceil(moment.duration(text, 'seconds').asDays())
          },
        },
        {
          title: 'Не загружена сверка (дней)',
          dataIndex: 'reviseOverdue',
          render: (text, row) => {
            if (text === null) {
              return null
            }
            if (text === 0) {
              return text
            }
            return Math.ceil(moment.duration(text, 'seconds').asDays())
          },
        },
        {
          title: 'Менеджеры',
          dataIndex: '',
          render: (text, row) => {
            return (
              <ChangingManager
                managerType="advertiserManager"
                id ={row.id}
                name={row.advertiserManager && row.advertiserManager.name || ''}
                managerId={row.advertiserManager && row.advertiserManager.id || null}
                managers={this.state.advertiserManagers}
              />
            )
          },
        },
      ]
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('Рекламодатели')

    this.fetch()
    api.get(Manager.data.advertiserManager.apiUrl)
    .then(response => {
      this.setState({ advertiserManagers: response.data })
    })
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/advertisers', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        ...filters,
        expand: 'advertiserManager,hold,balance,reviseOverdue,paymentOverdue',
      }
    })
    .then(response => {
      console.log('response', response.data);
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

export default Advertiser
