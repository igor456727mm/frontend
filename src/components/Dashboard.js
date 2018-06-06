import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Form, Input, InputNumber, Button, Select, message, DatePicker } from 'antd'
import qs from 'qs'
import moment from 'moment'
import * as Feather from 'react-feather'
import api from '../common/Api'
import Auth, { AuthForm } from '../common/Auth'
import Helpers, { t, pick, TreeSelect } from '../common/Helpers'
import Consultant from './Widgets/Consultant'
import News from './Widgets/News'

const disabledDate = (current) => current && current > moment().endOf('day')

class CustomTreeSelect extends Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      isLoading: false,
    }
  }

  componentDidMount = () => {
    const { value } = this.props
    if(value) this._onClick()
  }

  _onClick = () => {
    const { filter } = this.props
    const { data, isLoading } = this.state
    if(isLoading || data.length > 0) return
    this.setState({ isLoading: true })
    api.get(`v1/statistics/filters?name=${filter}`)
    .then(response => {
      this.setState({ data: response.data, isLoading: false })
    })
    .catch(e => {
      this.setState({ isLoading: false })
    })
  }

  render() {
    const { data, isLoading } = this.state
    return (
      <TreeSelect
        onClick={this._onClick}
        values={data}
        notFoundContent={isLoading ? Helpers.spinner() : Helpers.emptyText()}
        placeholder={t('field.all')}
        {...this.props}
      />
    )
  }
}

class _Filter extends Component {

  componentDidMount = () => {
    // hack for translate
    window.addEventListener('CHANGE_LANG', () => {
       this.setState({ tmp: 1 })
    }, false)
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      Object.keys(values).forEach(key => (values[key] === undefined || !values[key]) && delete values[key])
      this.props.onSubmit(values)
    })
  }

  validator = (name, input) => {
    const { getFieldDecorator } = this.props.form
    const options = { }
    if(name == 'action_day') options.initialValue = moment().startOf('day')
    return (
      <Form.Item className={`filter__field-${name}`}>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  render() {
    return (
      <div className="filter filter__tickets">
        <Form onSubmit={this.handleSubmit}>
          {this.validator('action_day', <DatePicker showToday={false} disabledDate={disabledDate} allowClear={false} size="large" format="DD.MM.YYYY"  /> )}
          {this.validator('stream_id', <CustomTreeSelect placeholder={t('field.all_streams')} filter="streams" /> )}
          {this.validator('country_id', <CustomTreeSelect placeholder={t('field.all_countries')} filter="countries" /> )}
          <Form.Item>
            <Button htmlType="submit" type="primary" loading={this.props.isLoading} size="large">{t('button.show')}</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}
const Filter = connect((state) => pick(state, 'user'))(Form.create()(_Filter))

class Dashboard extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      data: {},
      dataPrev: {},
      filters: {
        'q[action_day][equal]': moment().startOf('day').unix(),
      }
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.dashboard')
    this.fetch()

    /*/* window.addEventListener('CHANGE_LANG', () => {
      this.setState({ data: [], isLoading: false }, this._onClick)
    }, false) */
  }

  fetch = () => {
    this.fetchPrev()
    const { filters } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/statistics/revshare-report', {
      params: {
        ...filters
      }
    })
    .then(response => {
      this.setState({
        isLoading: false,
        data: response.data,
      })
    })
  }

  fetchPrev = () => {
    const { filters } = this.state
    api.get('/v1/statistics/revshare-report', {
      params: {
        ...filters,
        'q[action_day][equal]': filters['q[action_day][equal]'] - 86400
      }
    })
    .then(response => {
      this.setState({
        dataPrev: response.data,
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
          case 'action_day':
            filters[`q[${key}][equal]`] = val.startOf('day').unix()
            break;
          case 'stream_id':
          case 'country_id':
            filters[`q[${key}][in]`] = val.join(',')
            break;
          default:
            filters[`q[${key}][equal]`] = val
        }
      })
    }
    this.setState({ filters: filters}, this.fetch)
  }

  renderNumber = (field) => {
    const { data, dataPrev } = this.state
    let _class = 'none'
    if(data[field] > dataPrev[field]) _class = 'up'
    if(data[field] < dataPrev[field]) _class = 'down'
    return (
      <div className="flex">{data[field] || 0}<span className={_class}></span></div>
    )
  }

  render() {
    const { data, isLoading } = this.state
    const { user } = this.props
    return (
      <div className="content__wrapper">
        <div className="content__inner dashboard">
          <div className="row">
            <div className="col-md-4">
              <div className="dashboard__block block flex">
                <div className="dashboard__block-icon"><img src="img/icons/1.svg" /></div>
                <div className="dashboard__block-info">
                  <span>{user.default_revshare_percent * 100}%</span>
                  <div className="c__gray2">Revenue share</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="dashboard__block block flex">
                <div className="dashboard__block-icon"><img src="img/icons/2.svg" /></div>
                <div className="dashboard__block-info">
                  <span>${user.hold}</span>
                  <div className="c__gray2">{t('field.hold')}</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="dashboard__block block flex">
                <div className="dashboard__block-icon"><img src="img/icons/3.svg" /></div>
                <div className="dashboard__block-info">
                  <span>${user.balance}</span>
                  <div className="c__gray2">{t('field.balance')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="block dashboard__stats">
            <Filter onSubmit={this.onFilter} isLoading={isLoading} />
            <table>
              <tbody>
                <tr>
                  <td>
                    <h4>{t('field.hit_count')}</h4>
                    {this.renderNumber('hit_count')}
                  </td>
                  <td>
                    <h4>{t('field.reg_count')}</h4>
                    {this.renderNumber('reg_count')}
                  </td>
                  <td>
                    <h4>{t('field.reg_ratio')}</h4>
                    {this.renderNumber('reg_ratio')}
                  </td>
                </tr>
                <tr>
                  <td>
                    <h4>{t('field.first_dep_count')}</h4>
                    {this.renderNumber('first_dep_count')}
                  </td>
                  <td>
                    <h4>{t('field.dep_ratio')}</h4>
                    {this.renderNumber('dep_ratio')}
                  </td>
                  <td>
                    <h4>{t('field.all_dep_sum')}</h4>
                    {this.renderNumber('all_dep_sum')}
                  </td>
                </tr>
                <tr>
                  <td>
                    <h4>{t('field.all_dep_count')}</h4>
                    {this.renderNumber('all_dep_count')}
                  </td>
                  <td>
                    <h4>{t('field.active_players_count')}</h4>
                    {this.renderNumber('active_players_count')}
                  </td>
                  <td>
                    <h4>{t('field.first_dep_sum')}</h4>
                    {this.renderNumber('first_dep_sum')}
                  </td>
                </tr>
                <tr>
                  <td>
                    <h4>CPA</h4>
                    {this.renderNumber('cpa_confirmed_income_sum')}
                  </td>
                  <td>
                    <h4>{t('field.comission')}</h4>
                    {this.renderNumber('revshare_income')}
                  </td>
                  <td className="total">
                    <h4>{t('field.total_icome')}</h4>
                  <div className="flex">{((data.cpa_confirmed_income_sum || 0) + (data.revshare_income || 0)).toFixed(2)}</div>
                  </td>
                </tr>
              </tbody>
            </table>
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

export default connect((state) => pick(state, 'user'))(Dashboard)
