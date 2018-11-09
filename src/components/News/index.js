import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message } from 'antd'
import moment from 'moment'
import qs from 'qs'
import Cookies from 'js-cookie'
import { Link } from 'react-router-dom'
import Helpers, { Filters, Events, t, pick, clean, disabledDate } from '../../common/Helpers'
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
    const { statuses } = this.props
    const _statuses = Object.keys(statuses).map(item => <Select.Option key={item} value={item}>{statuses[item]}</Select.Option>)
    return (
      <div className="filter">
        <Form>
          {this.validator('created_at', t('field.date'), <DatePicker.RangePicker disabledDate={disabledDate} size="large" format="DD.MM.YYYY"  /> )}
          {this.validator('name', t('field.name'), <Input size="large" /> )}
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button onClick={this.handleSubmit} htmlType="submit" size="large">{t('button.show')}</Button>
          </Form.Item>
          <Form.Item>
            <h4>&nbsp;</h4>
            <Link class="ant-btn ant-btn-lg" to="/news/new">Добавить новость</Link>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class News extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      statuses: {},
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
          defaultSortOrder: 'descend',
        }, {
          title: 'Название',
          dataIndex: 'name',
          sorter: true,
          render: (text, row) => <Link to={`/news/${row.id}`}>{text}</Link>
        }, {
          title: 'Дата создания',
          dataIndex: 'created_at',
          render: text => moment.unix(text).format('DD.MM.YYYY HH:mm'),
          sorter: true,
        }, {
          title: 'Опубликовано',
          dataIndex: 'visible',
          render: (text) => text ? <span className="color__green">Да</span> : <span className="color__red">нет</span>
        }
      ]
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.news')

    this.fetch()
    Events.follow(`news.fetch`, this.fetch)
  }

  componentWillUnmount = () => {
    Events.unfollow(`news.fetch`, this.fetch)
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/news', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        ...filters,
        expand: 'offer'
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
    const { statuses, isLoading } = this.state
    const props = pick(this.state, 'data:dataSource', 'columns', 'pagination', 'isLoading:loading')
    return (
      <div>
        <Filter onSubmit={this.onFilter} statuses={statuses} />
        <Table
          rowKey={item => item.id}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange}
          {...props}
          />
      </div>
    )
  }
}

export default News
