import React, { Component } from 'react'
import { Form, Table, Select, Input, DatePicker, Button, message, Popover } from 'antd'
import moment from 'moment'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Helpers, { t, pick, TreeSelectRemote } from '../../common/Helpers'
import api from '../../common/Api'
import Consultant from '../Widgets/Consultant'

class Countries extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isVisible: false,
    }
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  renderContent = () => {
    const { countries } = this.props
    const items = countries.map((item, i) => {
      return (
        <p key={i} className="flex"><img src={`/img/flags/${item.code.toLowerCase()}.svg`} />{item.name}</p>
      )
    })
    return (
      <div className="offers__table-countries">{items}</div>
    )
  }

  render() {
    const { isVisible } = this.state
    const { countries } = this.props
    const items = countries.map((item, i) => {
      if(i > 1) return null
      return (
        <p key={i} className="flex"><img src={`/img/flags/${item.code.toLowerCase()}.svg`} />{item.name}</p>
      )
    })
    return (
      <div className="offers__table-countries">
        {items}
        {countries.length > 2 && (
          <Popover
            content={this.renderContent()}
            trigger="click"
            visible={isVisible}
            onVisibleChange={this._toggle}>
            <span className="link">...</span>
          </Popover>
        )}
      </div>
    )
  }
}

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
    return (
      <div className="filter filter__tickets">
        <Form onSubmit={this.handleSubmit}>
          {this.validator('country_id', t('field.targeting'), <TreeSelectRemote target="/v1/countries" /> )}
          {this.validator('category_id', t('field.category'), <TreeSelectRemote target="/v1/categories" /> )}
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button htmlType="submit" type="primary" size="large">{t('button.show')}</Button>
          </Form.Item>
          <Form.Item>
            <h4>&nbsp;</h4>
            <Link to={`/offers/new`} className="ant-btn ant-btn-lg">Создать оффер</Link>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = Form.create()(_Filter)

class Offers extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      filters: {},
      pagination: {
        hideOnSinglePage: true,
      },
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
        }, {
          dataIndex: 'logo',
          render: text => <img src={text} />
        }, {
          dataIndex: 'name',
          width: 220,
          render: (text, row) => <Link to={`/offers/${row.id}`}>{text}</Link>,
        }, {
          dataIndex: 'program_description',
        }, {
          title: 'GEO',
          dataIndex: '',
          render: (text, row) => <Countries countries={row.countries} />
        }, {
          title: 'CR',
          dataIndex: 'avg_cr',
          render: text => `${text}%`
        }, {
          title: 'EPC',
          dataIndex: 'avg_epc'
        }, {
          render: (text, row) => {
            const categories = row.categories.map(item => item.name)
            return categories.join(',')
          }
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
    Helpers.setTitle('menu.offers')
    this.fetch()

    /* api.get('/v1/withdrawals/statuses')
    .then(response => {
      this.setState({ statuses: response.data })
    }) */
  }

  fetch = (page = 1) => {
    const { filters } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/offers', {
      params: {
        sort: '-id',
        page: page,
        expand: 'countries,categories',
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
          case 'country_id':
          case 'category_id':
            filters[`q[${key}][in]`] = val.join(',')
            break;
          default:
            filters[`q[${key}][equal]`] = val
        }
      })
    }
    this.setState({ filters: filters}, this.fetch)
  }

  /* renderTargeting = () => {
    const { showTargeting } = this.state
    const { countries } = this.state.data
    if(!countries) return <span>{t('emptyText')}</span>
    const btn = !showTargeting && countries.length > 2 && <a onClick={this._showTargeting}>{t('button.show_all')}</a>
    const items = countries.map((item, i) => {
      if(!showTargeting && i > 2) return null
      return (
        <p key={i} className="flex"><img src={`/img/flags/${item.code}.svg`} />{item.name}</p>
      )
    })
    return <div>{items}{btn}</div>
  } */

  render() {
    const { data, columns, pagination, statuses, isLoading } = this.state

    columns[2].title = t('field.offer')
    columns[3].title = t('field.deductions')
    columns[7].title = t('field.category')

    return (
      <div>
        <Filter onSubmit={this.onFilter} statuses={statuses} />
        <Table
          className="offers__table"
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

export default Offers
