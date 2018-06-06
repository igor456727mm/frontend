import React, { Component } from 'react'
import { Form, Table, Select, Input, Button, message, Pagination } from 'antd'
import moment from 'moment'
import { connect } from 'react-redux'
import copy from 'copy-to-clipboard'
import Helpers, { t, pick } from '../../common/Helpers'
import api from '../../common/Api'
import Consultant from '../Widgets/Consultant'
import News from '../Widgets/News'

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
    const { types, offers } = this.props
    const _types = Object.keys(types).map(key => <Select.Option key={key} value={key}>{types[key]}</Select.Option>)
    const _offers = offers.map(item => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)
    return (
      <div className="filter filter__promo">
        <Form onSubmit={this.handleSubmit}>
          {this.validator('offer_id', t('field.offer'), <Select placeholder={t('field.all')} size="large" allowClear>{_offers}</Select> )}
          {this.validator('type', t('field.types'), <Select placeholder={t('field.all')} size="large" allowClear>{_types}</Select> )}
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

class Promo extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      filters: {},
      types: {},
      offers: [],
      pagination: {
        hideOnSinglePage: true,
        current: 1,
      },
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.promo')
    this.fetch()

    api.get('/v1/offers?has_promo=1')
    .then(response => {
      this.setState({ offers: response.data })
    })

    window.addEventListener('CHANGE_LANG', () => {
      const { current } = this.state.pagination
      this.fetch(current)
    }, false)

    this.fetchFilters()
    window.addEventListener('CHANGE_LANG', this.fetchFilters, false)
  }

  fetchFilters = () => {
    api.get('/v1/promotional-materials/types')
    .then(response => {
      this.setState({ types: response.data })
    })
  }

  componentWillUnmount = () => {
    // window.removeEventListener('CHANGE_LANG', this.fetch.bind(this))
  }

  fetch = (page = 1) => {
    const { filters } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/promotional-materials', {
      params: {
        sort: '-id',
        page: page,
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

  handlePageChange = (page) => {
    const { pagination } = this.state
    pagination.current = page
    this.setState({ pagination: pagination }, () => {
      this.fetch(page)
    })
  }

  onFilter = (values) => {
    const filters = {}
    const keys = Object.keys(values)
    if(keys) {
      keys.forEach(key => {
        const val = values[key]
        switch (key) {
          default:
            filters[`q[${key}][equal]`] = val
        }
      })
    }
    this.setState({ filters: filters}, this.fetch)
  }

  renderItems = () => {
    const { data } = this.state
    return data.map(item => {
      let preview
      let btn = <a href={item.data.url} download className="ant-btn ant-btn-primary ant-btn-lg">{t('button.download')}</a>
      switch (item.type) {
        case 'code':
          preview = <code>{item.data.code}</code>
          btn = <Button type="primary" size="large" onClick={() => { copy(item.data.code); message.success('button.copy.message.success'); }}>{t('button.copy')}</Button>
          break;
        case 'video':
          preview = <video src={item.data.url} controls></video>
          break;
        case 'image':
          preview = <div className="promo__list-item-preview-image" style={{ backgroundImage: `url(${item.data.url})`}}></div>
          break;
      }

      return (
        <div className="block promo__list-item" key={item.id}>
          <div className="row">
            <div className="col-md-6">
              <div className={`promo__list-item-preview ${item.type}`}>{preview}</div>
            </div>
            <div className="col-md-6">
              <strong>{item.name}</strong>
              <div className="promo__list-item-description">{item.description}</div>
              {btn}
            </div>
          </div>
        </div>
      )
    })
  }

  render() {
    const { pagination, isLoading } = this.state
    return (
      <div className="content__wrapper">
        <div className="content__inner promo">
          <Filter onSubmit={this.onFilter} {...pick(this.state, 'offers', 'types')} />
          <div className="promo__list">
            {this.renderItems()}
            <Pagination onChange={this.handlePageChange} {...pagination} />
          </div>
        </div>
        <div className="content__sidebar">
          <Consultant />
          <News />
        </div>
      </div>
    )
  }
}

export default Promo
