import React, { Component } from 'react'
import { Form, Table, Select, Input, Button, message, Pagination } from 'antd'
import moment from 'moment'
import { Link } from 'react-router-dom'
import Helpers, { t, pick } from '../../common/Helpers'
import api from '../../common/Api'
import Consultant from '../Widgets/Consultant'

class News extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      pagination: {
        hideOnSinglePage: true,
        current: 1,
      },
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.news')
    this.fetch()
    window.addEventListener('CHANGE_LANG', () => {
      const { current } = this.state.pagination
      this.fetch(current)
    }, false)
  }

  componentWillUnmount = () => {
    // window.removeEventListener('CHANGE_LANG', this.fetch.bind(this))
  }

  handlePageChange = (page) => {
    const { pagination } = this.state
    pagination.current = page
    this.setState({ pagination: pagination }, () => {
      this.fetch(page)
    })
  }

  fetch = (page = 1) => {
    this.setState({ isLoading: true })
    api.get('/v1/news', {
      params: {
        sort: '-id',
        page: page,
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


  renderItems = () => {
    const { data } = this.state
    return data.map(item => {
      const date = moment.unix(item.created_at).format('DD.MM.YYYY (HH:mm)')
      return (
        <div className="block news__list-item" key={item.id}>
          <div className="flex news__header">
            <h3>{item.name}</h3>
            <div className="c__gray2">{date}</div>
          </div>
          <div className="news__list-item-description c__gray2">{item.description}</div>
          <Link to={`/news/${item.id}`} className="ant-btn ant-btn-primary ant-btn-lg">{t('button.show')}</Link>
        </div>
      )
    })
  }

  render() {
    const { pagination, isLoading } = this.state
    return (
      <div className="content__wrapper">
        <div className="content__inner news">
          <div className="news__list">
            {this.renderItems()}
            <Pagination onChange={this.handlePageChange} {...pagination} />
          </div>
        </div>
        <div className="content__sidebar">
          <Consultant />
        </div>
      </div>
    )
  }
}

export default News
