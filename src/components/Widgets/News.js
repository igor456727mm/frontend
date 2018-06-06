import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Helpers, { t, pick } from '../../common/Helpers'
import api from '../../common/Api'
import moment from 'moment'

class News extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      data: [],
    }
  }

  componentDidMount = () => {
    this.fetch()
    window.addEventListener('CHANGE_LANG', this.fetch, false)
  }

  fetch = () => {
    this.setState({ isLoading: true })
    api.get('/v1/news', {
      params: {
        sort: '-id',
        'q[important][equal]': 1,
        'per-page': 3,
      }
    })
    .then(response => {
      this.setState({
        isLoading: false,
        data: response.data,
      })
    })
  }


  renderItems = () => {
    const { data } = this.state
    return data.map(item => {
      const date = moment.unix(item.created_at).format('DD.MM.YY')
      return (
        <div className="block widget__news-item" key={item.id}>
          <div className="flex news__header">
            <h3>{item.name}</h3>
            <div className="c__gray2">{date}</div>
          </div>
          <p>{item.description}</p>
          <Link to={`/news/${item.id}`} className="link">{t('button.readmore')}</Link>
        </div>
      )
    })
  }

  render() {
    return (
      <div className="widget__news">
        {this.renderItems()}
      </div>
    )
  }
}

export default connect((state) => pick(state, 'user', 'lang'))(News)
