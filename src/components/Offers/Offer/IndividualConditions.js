import React, { Component } from 'react'
import { Form, Table, Select, Input, InputNumber, DatePicker, Button, message, Upload, Icon, Checkbox, Modal, Popconfirm } from 'antd'
import moment from 'moment'
import Cookies from 'js-cookie'
import qs from 'qs'
import { connect } from 'react-redux'
import { Route, Redirect, Switch, NavLink, Link } from 'react-router-dom'
import Helpers, { Events, Filters, t, pick, clean, disabledDate, flatten } from '../../../common/Helpers'
import api from '../../../common/Api'
import * as Feather from 'react-feather'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import SearchSelect from '../../../common/Helpers/SearchSelect'

const Icons = {}

class _Action extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      isVisible: false,
      isEdit: props.data ? true : false
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data, actions, action_id } = this.props
    const { getFieldDecorator, getFieldsValue } = this.props.form
    const options = { rules: rules }
    if(data && data[name]) {
      options.initialValue = data[name]
    } else if(data && name.includes('.')) {
      const tmp = data && flatten(data) || {}
      if(initialValue) {
        options.initialValue = initialValue
      } else if(tmp[name]) {
        options.initialValue = tmp[name]
      }
    } else if(name.includes('.')) {
      const values = getFieldsValue()
      if(values.action_id) {
        let _data = {}
        actions.forEach(action => {
          if(action.id !== parseInt(values.action_id)) return
          _data = { pay_conditions: action.pay_conditions }
        })
        const tmp = _data && flatten(_data) || {}
        if(tmp[name]) {
          options.initialValue = tmp[name]
        }
      }
    }

    if(['pay_conditions.fields.commission_percent', 'pay_conditions.fields.site_revshare_percent', 'pay_conditions.fields.revshare_percent'].includes(name) && options.initialValue) {
      options.initialValue = parseFloat(options.initialValue) * 100
    }

    if(typeof options.initialValue === 'boolean') options.valuePropName = 'checked'
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, data, offer_id, isEdit } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)
      if(values.pay_conditions.fields.commission_percent) values.pay_conditions.fields.commission_percent = values.pay_conditions.fields.commission_percent / 100
      if(values.pay_conditions.fields.revshare_percent) values.pay_conditions.fields.revshare_percent = values.pay_conditions.fields.revshare_percent / 100
      if(values.pay_conditions.fields.site_revshare_percent) values.pay_conditions.fields.site_revshare_percent = values.pay_conditions.fields.site_revshare_percent / 100

      this.setState({ iconLoading: true })

      const key = `${values.user_id},${offer_id}`
      api.get(`/v1/user-offer-individual-conditions/${key}`)
      .then(tmp => {
        // edit
        const params = {
          user_id: values.user_id,
          offer_id: offer_id,
          visible: values.visible ? 1 : 0,
          //have_access: values.have_access ? 1 : 0,
          pay_conditions: tmp.data.pay_conditions
        }
        params.pay_conditions[values.action_id] = values.pay_conditions
        params.pay_conditions = JSON.stringify(params.pay_conditions)
        api.patch(`/v1/user-offer-individual-conditions/${key}`, qs.stringify(params))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Цель сохранена'))
          Events.dispatch('individualconditions.fetch')
          form.resetFields()
          this._toggle()
        })

      })
      .catch(e => {
        // new
        const params = {
          user_id: values.user_id,
          offer_id: offer_id,
          visible: values.visible ? 1 : 0,
          //have_access: values.have_access ? 1 : 0,
          pay_conditions: {},
        }
        params.pay_conditions[values.action_id] = values.pay_conditions
        params.pay_conditions = JSON.stringify(params.pay_conditions)
        api.post(`/v1/user-offer-individual-conditions`, qs.stringify(params))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Цель добавлена'))
          Events.dispatch('individualconditions.fetch')
          form.resetFields()
          this._toggle()
        })
      })




    })
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  _onDelete = () => {
    const { data, offer_id } = this.props
    const key = `${data.user_id},${offer_id}`

    api.get(`/v1/user-offer-individual-conditions/${key}`)
    .then(response => {
      const count = Object.keys(response.data.pay_conditions).length

      if(count > 1) {
        // many
        const pay_conditions = response.data.pay_conditions
        delete pay_conditions[data.action_id]
        api.patch(`/v1/user-offer-individual-conditions/${key}`, qs.stringify({ pay_conditions: JSON.stringify(pay_conditions) }))
        .then(response => {
          message.success(t('Цель удалена'))
          Events.dispatch('individualconditions.fetch')
        })
      } else {
        // one
        api.delete(`/v1/user-offer-individual-conditions/${key}`)
        .then(response => {
          message.success(t('Цель удалена'))
          Events.dispatch('individualconditions.fetch')
        })
      }
    })

  }

  _onChangeActionId = (action_id) => {
    const { actions, form } = this.props
    if(actions && action_id) {
      actions.forEach(action => {
        if(action.id !== parseInt(action_id)) return
        form.setFieldsValue({ 'pay_conditions.pay_type': action.pay_conditions.pay_type })
      })
    }
  }

  _checkRevshareComission = () => {
    const { pay_conditions } = this.props.form.getFieldsValue()
    let { site_revshare_percent = 0, revshare_percent = 0 } = pay_conditions.fields
    if(isNaN(site_revshare_percent)) site_revshare_percent = 0
    if(isNaN(revshare_percent)) revshare_percent = 0
    return (parseInt(site_revshare_percent) - parseInt(revshare_percent))
  }

  render() {
    const { isVisible, iconLoading, isEdit } = this.state
    const { data, form, currency_id, actions } = this.props
    const currency = '$'

    let fields = null
    const { pay_conditions, ...values } = form.getFieldsValue()
    if(pay_conditions && pay_conditions.pay_type) {
      switch (pay_conditions.pay_type) {
        case 'fix':
          fields = (
            <div className="row">
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.price', `Стоимость в ${currency}`, <InputNumber min={0} size="large" /> )}
              </div>
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.commission', `Комиссия в ${currency}`, <InputNumber min={0} size="large" /> )}
              </div>
            </div>
          )
          break;
        case 'flex':
          fields = (
            <div className="row">
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.price_from', `Стоимость от, в ${currency}`, <InputNumber min={0} size="large" /> )}
              </div>
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.price_to', `Стоимость до, в ${currency}`, <InputNumber min={0} size="large" /> )}
              </div>
              <div className="col-md-12">
                {this.validator('pay_conditions.fields.commission_percent', 'Комиссия', <InputNumber formatter={value => `${value}%`} parser={value => value.replace('%', '')} min={0} max={100} size="large"/>, [], '0' )}
              </div>
            </div>
          )
          break;
        case 'revshare':
          fields = (
            <div className="row">
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.site_revshare_percent', 'Ревшара сайта', <InputNumber formatter={value => `${value}%`} parser={value => value.replace('%', '')} min={0} max={100} size="large"/> )}
              </div>
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.revshare_percent', 'Ревшара вебмастера', <InputNumber formatter={value => `${value}%`} parser={value => value.replace('%', '')} min={0} max={pay_conditions.fields && pay_conditions.fields.site_revshare_percent || 100} size="large"/> )}
              </div>
              <div className="col-md-12">
                <div className="offer_conditions-revshare-text" style={{ color: 'red', marginBottom: '20px' }}>
                  Комиссия партнерской программы - {this._checkRevshareComission()}%
                </div>
              </div>
            </div>
          )
          break;
      }
    }

    // action
    const _actions = actions.map(action => <Select.Option key={action.id} value={action.id.toString()}>{action.name}</Select.Option>)
    let placeholders = { name: null, description: null }
    if(actions && values.action_id) {
      actions.forEach(action => {
        if(action.id !== parseInt(values.action_id)) return
        placeholders = { name: action.name, description: action.description }
      })
    }

    return (
      <span>
        {isEdit && (
          <div className="table__actions" style={{ marginLeft: '16px' }}>
            <span onClick={this._toggle}>изменить</span>
            <Popconfirm title="Удалить" onConfirm={this._onDelete} okText="Да" cancelText="Нет">
              <span className="table__actions-delete">удалить</span>
            </Popconfirm>
          </div>
        ) || <Button style={{ float: 'right' }} onClick={this._toggle}>Добавить</Button>}
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
          <h1>{isEdit ? `Редактирование индивид. цели` : 'Добавление индивид. цели'}</h1>

            <Form>
              {this.validator('action_id', 'Цель', <Select onChange={this._onChangeActionId} disabled={isEdit} size="large">{_actions}</Select>, [{ required: true }] )}
              {this.validator('user_id', 'Пользователь', <SearchSelect disabled={isEdit} target="users" />, [{ required: true }] )}
              {this.validator('pay_conditions.name', t('field.name'), <Input size="large" placeholder={placeholders.name} /> )}
              {this.validator('pay_conditions.pay_type', 'Ставка', (
                <Select size="large">
                  <Select.Option value="fix">Фиксированная</Select.Option>
                  <Select.Option value="flex">Динамическая</Select.Option>
                  <Select.Option value="revshare">Revshare</Select.Option>
                </Select>
              ))}

              {fields}

              <div className="row">
                <div className="col-md-6">
                  {this.validator('pay_conditions.fields.hold', 'Холд', <InputNumber min={0} size="large" /> )}
                </div>

              </div>

              <div className="row">
                <div className="col-md-6">
                  {this.validator('visible', '', <Checkbox  size="large">Видимый</Checkbox> )}
                </div>
                <div className="col-md-6">
                  {this.validator('limit', 'Лимиты', <InputNumber size="large" /> )}
                </div>

              </div>

              <Form.Item className="form__item-last">
                <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
              </Form.Item>
            </Form>

        </Modal>
      </span>
    )
  }

}
const Action = Form.create()(_Action)

class IndividualConditions extends Component {

  constructor(props) {
    super(props)

    const id = props.offer_id

    this.state = {
      data: [],
      filters: Filters.parse(),
      modules: [],
      statuses: {},
      pagination: {
        hideOnSinglePage: true,
      },
      columns: [
        {
          title: 'Условия',
          render: (text, row) => {
            if(!row.pay_conditions) return
            return Object.keys(row.pay_conditions).map((k, i) => {
              const name = row.pay_conditions[k] && row.pay_conditions[k].name || this.actionFieldById(k, 'name')
              return (
                <div className="flex" key={`${i}_0`}>
                  <strong className="table__actions-name">{name}</strong>
                  <Action
                    data={{ pay_conditions: row.pay_conditions[k], action_id: k, ...pick(row, 'user_id', 'visible') }}
                    offer_id={id}
                    actions={this.props.actions}
                    />

                </div>
              )
            })
          }
        }, {
          title: 'Ставка',
          render: (text, row) => {
            if(!row.pay_conditions) return
            return Object.keys(row.pay_conditions).map((k, i) => {
              if(!row.pay_conditions[k]) return
              const { pay_type, fields } = row.pay_conditions[k]
              let value
              switch(pay_type) {
                case 'fix':
                  value = `${fields.price} $`
                  break;
                case 'flex':
                  value = fields.price_to && `до ${fields.price_to} $` || `от ${fields.price_from} $`
                  break;
                case 'revshare':
                  value = `${fields.revshare_percent * 100}%`
                  break;
              }
              return <div key={`${i}_1`}>{value}</div>
            })
          }
        }, {
          title: 'Холд',
          render: (text, row) => {
            if(!row.pay_conditions) return
            return Object.keys(row.pay_conditions).map((k, i) => {
              const { fields } = row.pay_conditions[k]
              return (<div key={`${i}_2`}>до {fields.hold} дней</div>)
            })
          }
        }, {
          title: <Action offer_id={id} actions={this.props.actions} />,
          dataIndex: 'user.login',
          render: (text, row) => text && <Link to={`/users/${row.user.id}`}>{text}</Link>
        }
      ]
    }
  }

  actionFieldById = (id, field) => {
    const { actions } = this.props
    let value = null
    actions.forEach(action => {
      if(action['id'] == id) {
        value = action[field]
      }
    })
    return value
  }

  componentDidMount = () => {
    this.fetch()
    Events.follow('individualconditions.fetch', this.fetch)
  }

  componentWillUnmount = () => {
    Events.unfollow(`individualconditions.fetch`, this.fetch)
  }

  fetch = () => {
    const { filters, pagination } = this.state
    this.setState({ isLoading: true })
    api.get('/v1/user-offer-individual-conditions', {
      params: {
        sort: pagination.sort || '-id',
        page: pagination.current || 1,
        ...filters,
        expand: 'user',
        'q[offer_id][equal]': this.props.offer_id
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
    const sort = (order && columnKey) && (order == 'ascend' ? columnKey : `-${columnKey}`)
    const pagination = { ...this.state.pagination, current: page, sort: sort }
    this.setState({ pagination }, this.fetch)
  }

  onFilter = (values) => {
    const filters = Filters.prepare(values)
    this.setState({ filters }, this.fetch)
  }

  render() {
    const { statuses, modules, isLoading } = this.state
    const props = pick(this.state, 'data:dataSource', 'columns', 'pagination')
    return (
      <div className="offer__individual" style={{ marginTop: '30px'}}>
        <h3>Индивидуальные условия</h3>
        <Table
          rowKey={(item,i) => `${item.user_id},${item.offer_id}`}
          locale={{ emptyText: Helpers.emptyText }}
          onChange={this.handleTableChange}
          {...props}
          />
      </div>
    )
  }
}

export default IndividualConditions

// export default connect((state) => pick(state, 'config'))(Form.create()(Offer))
