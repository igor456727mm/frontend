import React, { Component } from 'react'
import { Form, Table, Select, Input, Button, message, Pagination } from 'antd'
import moment from 'moment'
import { Link } from 'react-router-dom'
import Helpers, { t, pick } from '../../common/Helpers'
import api from '../../common/Api'
import Consultant from '../Widgets/Consultant'

class NewsItem extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: true,
      data: {
        id: this.props.match.params.id
      },
    }
  }

  componentDidMount = () => {
    this.fetch()
    window.addEventListener('CHANGE_LANG', this.fetch, false)
  }

  componentWillUnmount = () => {
    // window.removeEventListener('CHANGE_LANG', this.fetch)
  }

  fetch = () => {
    const { id } = this.state.data
    api.get(`/v1/news/${id}`)
    .then(response => {
      this.setState({
        isLoading: false,
        data: response.data,
      })
    })
    .catch(e => {
      Helpers.errorHandler(e)
    })
  }

  render() {
    const { isLoading, data } = this.state
    const date = moment.unix(data.created_at).format('DD.MM.YYYY (HH:mm)')
    return (
      <div className="content__wrapper">
        <div className="content__inner news">
          <div className="block">
            <div className="flex news__header">
              <h3>{data.name}</h3>
              <div className="c__gray2">{date}</div>
            </div>
            <div className="news__content">
              <div dangerouslySetInnerHTML={{__html: data.text }} />
            </div>
          </div>
        </div>
        <div className="content__sidebar">
          <Consultant />
        </div>
      </div>
    )
  }
}

export default NewsItem
