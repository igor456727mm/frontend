import React, { Component } from 'react'
import { Form, Table, Select, Input, InputNumber, DatePicker, Button, message, Upload, Icon, Checkbox, Modal, Popconfirm } from 'antd'
import moment from 'moment'
import Cookies from 'js-cookie'
import qs from 'qs'
import { connect } from 'react-redux'
import { Route, Redirect, Switch, NavLink, Link } from 'react-router-dom'
import * as Feather from 'react-feather'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import Helpers, { t, pick, clean, TreeSelectRemote, OfferAccessButton } from '../../common/Helpers'
import IndividualConditions from './Offer/IndividualConditions'
import SearchSelect from '../../common/Helpers/SearchSelect'
import api from '../../common/Api'
import { cookie_prefix } from '../../../package.json'
import { domain, scheme } from '../../config'


const Icons = {}
class _Landing extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      isVisible: false,
      isEdit: props.data ? true : false
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.props
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data && [name]) options.initialValue = data[name]
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, data, offer_id } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)
      if(data && data.id) {
        api.patch(`/v1/landings/${data.id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Лендинг сохранен'))
          window.dispatchEvent(new Event('landings.fetch'))
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        values.offer_id = offer_id
        api.post(`/v1/landings`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Лендинг добавлен'))
          window.dispatchEvent(new Event('landings.fetch'))
          form.resetFields()
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }
    })
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  render() {
    const { isVisible, iconLoading, isEdit } = this.state
    const { data } = this.props
    return (
      <span>
        {isEdit && <span onClick={this._toggle}>Изменить</span> || <Button style={{ float: 'right' }} onClick={this._toggle}>Добавить</Button>}
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
          <h1>{isEdit ? `Лендинг #${data.id}` : 'Создание лендинга'}</h1>
          <Form>
            {this.validator('name', t('field.name'), <Input size="large" />, [{ required: true }] )}
            {this.validator('url', t('field.url'), <Input size="large" />, [] )}
            {this.validator('webmaster_id', t('field.user'), <SearchSelect  target="users" />)}
            <Form.Item className="form__item-last">
              <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
            </Form.Item>
          </Form>
        </Modal>
      </span>
    )
  }

}
const Landing = Form.create()(_Landing)

class _Action extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      isVisible: false,
      isEdit: props.data ? true : false
    }
  }

  componentDidMount = () => {
    const { isEdit } = this.state
    // translate костыли
    if(isEdit) {
      api.get('/v1/translations', {
        params: {
          'q[model_class_name][equal]': 'Action',
          'q[model_id][equal]': this.props.data.id,
          'q[attribute][equal]': 'name',
          'q[language][equal]': 'en',
        }
      })
      .then(response => {
        response.data.map(item => {
          /* const { data } = this.state
          data[`${item.attribute}_en`] = item.text,
          data[`${item.attribute}_en_id`] = item.id
          this.setState({ data: data }) */
          const options = {}
          options[`${item.attribute}_en`] = item.text
          options[`${item.attribute}_en_id`] = item.id
          this.props.form.setFieldsValue(options)
        })
      })
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.props
    const { getFieldDecorator } = this.props.form
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

      if(['pay_conditions.fields.commission_percent', 'pay_conditions.fields.site_revshare_percent', 'pay_conditions.fields.revshare_percent'].includes(name) && tmp[name]) {
        options.initialValue = parseFloat(tmp[name]) * 100
      }



    } else if(initialValue) {
      options.initialValue = initialValue
    }

    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, data, offer_id } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)

      if(values.pay_conditions.fields.commission_percent) values.pay_conditions.fields.commission_percent = values.pay_conditions.fields.commission_percent / 100
      if(values.pay_conditions.fields.revshare_percent) values.pay_conditions.fields.revshare_percent = values.pay_conditions.fields.revshare_percent / 100
      if(values.pay_conditions.fields.site_revshare_percent) values.pay_conditions.fields.site_revshare_percent = values.pay_conditions.fields.site_revshare_percent / 100

      if(data && data.id) {
        api.patch(`/v1/actions/${data.id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Цель сохранена'))
          window.dispatchEvent(new Event('actions.fetch'))
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })



        // translate
        if(values.name_en_id && values.name_en) {
          api.patch(`/v1/translations/${values.name_en_id}`, qs.stringify({ text: values.name_en }))
        } else if(values.name_en) {
          api.post(`/v1/translations`, qs.stringify({
            text: values.name_en,
            model_id: data.id,
            model_class_name: 'Action',
            attribute: 'name',
            'language': 'en'
          }))
          .then(response => {
            this.props.form.setFieldsValue({ name_en_id: response.data.id })
          })
        }

      } else {
        values.offer_id = offer_id
        api.post(`/v1/actions`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Цель добавлена'))
          window.dispatchEvent(new Event('actions.fetch'))
          form.resetFields()
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }
    })
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  _checkRevshareComission = () => {
    const { pay_conditions } = this.props.form.getFieldsValue()
    let { site_revshare_percent = 0, revshare_percent = 0 } = pay_conditions.fields
    if(isNaN(site_revshare_percent)) site_revshare_percent = 0
    if(isNaN(revshare_percent)) revshare_percent = 0
    return (parseInt(site_revshare_percent) - parseInt(revshare_percent))
  }

  render() {
    const { isVisible, iconLoading, isEdit } = this.state
    const { data, form, currency_id } = this.props
    const currency = '$'
    let fields = null
    const { pay_conditions } = form.getFieldsValue()
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
                {this.validator('pay_conditions.fields.site_revshare_percent', 'Ревшара сайта', <InputNumber formatter={value => `${value}%`} parser={value => value.replace('%', '')} min={0} max={100} size="large"/>, [], '0' )}
              </div>
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.revshare_percent', 'Ревшара вебмастера', <InputNumber formatter={value => `${value}%`} parser={value => value.replace('%', '')} min={0} max={pay_conditions.fields && pay_conditions.fields.site_revshare_percent || 100} size="large"/>, [], '0' )}
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

    return (
      <span>
        {isEdit && <span onClick={this._toggle}>Изменить</span> || <Button style={{ float: 'right' }} onClick={this._toggle}>Добавить</Button>}
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
          <h1>{isEdit ? `Цель #${data.id}` : 'Добавление цели'}</h1>
          <Form>
            {this.validator('name', t('field.name'), <Input size="large" />, [{ required: true }] )}
            {this.validator('name_en', 'Название EN', <Input size="large" placeholder={!isEdit ? 'Доступно при редактировании' : undefined} disabled={!isEdit} /> )}
            <div style={{ display: 'none' }}>{this.validator('name_en_id', '', <Input size="large" /> )}</div>
            {this.validator('alias', 'Код действия (например: reg или dep)', <Input size="large" /> )}
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

class Offer extends Component {

  constructor(props) {
    super(props)
    const { id } = props.match.params
    this.state = {
      isNew: id == 'new',
      isLoading: true,
      data: {
        id: id,
        // description: null,
        status: 'active',
        visible: 1,
      },
      countries: [],
      categories: [],
      statuses: {},
      landings: [],
      sources: [], // global sources
      actions: [],
      advertisers: [],
      columns: {
        actions: [
          {
            title: 'Название',
            dataIndex: 'name',
            render: (text, row) => {
              return (
                <div>
                  <strong className="table__actions-name">{text}</strong>
                  <div>{row.description}</div>
                </div>
              )
            }
          },
          {
            title: 'Условия',
            render: (text, row) => {
              const { pay_type, fields } = row.pay_conditions
              let condition, name, price, commission, site_revshare_percent, revshare_percent, price_from, price_to
              const getPercent = number => Math.round(number * 10000) / 100
              switch (pay_type) {
                case 'flex':
                  price_from = fields.price_from != null ? fields.price_from : '-'
                  price_to = fields.price_to != null ? fields.price_to : '-'
                  condition = (
                    <span>
                      Стоимость от&nbsp;
                      <span style={{ whiteSpace: 'nowrap' }} >
                        {price_from}$&nbsp;
                      </span>
                        / Стоимость до&nbsp;
                      <span style={{ whiteSpace: 'nowrap' }} >
                        {price_to}$&nbsp;
                      </span>
                    </span>
                  )
                  return condition
                case 'fix':
                  price = fields.price != null ? fields.price : '-'
                  commission = fields.commission != null ? fields.commission : '-'
                  condition = <span>Стоимость <span style={{ whiteSpace: 'nowrap' }} >{price}$</span> / Комиссия <span style={{ whiteSpace: 'nowrap' }} >{commission}$</span></span>
                  return condition
                case 'revshare':
                  site_revshare_percent = fields.site_revshare_percent != null ? getPercent(fields.site_revshare_percent) : '-'
                  revshare_percent = fields.revshare_percent != null ? getPercent(fields.revshare_percent) : '-'
                  condition = <span>Ревшара сайта: <span style={{ whiteSpace: 'nowrap' }} >{site_revshare_percent}%</span> / Ревшара вебмастера: <span style={{ whiteSpace: 'nowrap' }} >{revshare_percent}%</span></span>
                  return condition
              }

            },
            width: 220,
          },
          {
            title: 'Холд',
            render: (text, row) => {
              const { fields } = row.pay_conditions
              return `до ${fields.hold} дней`
            }
          },
          {
            title: <Action offer_id={id} />,
            render: (text, row) => {
              return (
              <div className="table__actions" style={{ textAlign: 'right' }}>
                <Action data={row} offer_id={id} currency_id={this.props.form.getFieldValue('currency_id')} />
                <Popconfirm title="Удалить" onConfirm={() => this._onDeleteAction(row.id)} okText="Да" cancelText="Нет">
                  <span className="table__actions-delete">Удалить</span>
                </Popconfirm>
              </div>
            )}
          }
        ],
        landings: [
          {
            title: 'Лендинг',
            dataIndex: 'name',
          }, {
            title: 'URL',
            dataIndex: 'url',
            render: (text) => text && <a href={text} target="_blank" className="landing_url">{text}</a> || '-'
          },
          {
            title: 'Пользователь',
            dataIndex: '',
            render: (text, row) => {
              const id = text.webmaster ? text.webmaster.id : null
              const email = text.webmaster ? text.webmaster.email : null
              return (id && email) ? `#${id} ${email}` : ''
            }
          },
           {
            title: 'CR',
            dataIndex: 'sys_cr',
            render: text => `${text}%`
          }, {
            title: 'EPC',
            dataIndex: 'sys_epc'
          }, {
            title: <Landing offer_id={id} />,
            render: (text, row) => {
              const link = `${scheme}w-api.${domain}/v1/landings/${row.id}/open`
              return (
              <div className="table__actions">
                {/* <span><a href={link} target="_blank">{Icons.eye}</a></span> */}
                <Landing data={row} offer_id={id} />
                <Popconfirm title="Удалить" onConfirm={() => this._onDeleteLanding(row.id)} okText="Да" cancelText="Нет">
                  <span className="table__actions-delete">Удалить</span>
                </Popconfirm>
              </div>
            )}
          }
        ]
      },

      logo_upload_image_id: null,
      new_logo: null,
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.offers')
    const { isNew } = this.state

    this.fetch()
    if(!isNew) {
      this.fetchLandings()
      this.fetchActions()
    }

    window.addEventListener(`landings.fetch`, this.fetchLandings)
    window.addEventListener(`actions.fetch`, this.fetchActions)
  }

  componentWillUnmount = () => {
    window.removeEventListener(`landings.fetch`, this.fetchLandings)
    window.removeEventListener(`actions.fetch`, this.fetchActions)
  }

  fetch = () => {
    const { id } = this.state.data
    const { isNew } = this.state
    if(!isNew) {
      api.get(`/v1/offers/${id}?expand=countries,trafficSources,categories`)
      .then(response => {
        response.data.traffic_source_ids = response.data.trafficSources.map(item => item.id)
        response.data.country_ids = response.data.countries.map(item => item.id)
        response.data.category_ids = response.data.categories.map(item => item.id)
        delete response.data.trafficSources
        delete response.data.countries
        delete response.data.categories

        // targeting
        if(response.data.country_data && response.data.country_data.countries) {
          response.data.country_data.countries = response.data.country_data.countries.map(country => country.id)
        }

        if(response.data.country_data && response.data.country_data.except) {
          response.data.country_data.except = response.data.country_data.except.map(country => country.id)
        }

        // visible
        response.data.visible = response.data.visible == true ? 1 : 0

        this.setState({
          // isLoading: false,
          data: response.data
         })
      })

      // translate костыли
      api.get('/v1/translations', {
        params: {
          'q[model_class_name][equal]': 'Offer',
          'q[model_id][equal]': id,
          'q[attribute][in]': 'description,short_description',
          'q[language][equal]': 'en',
        }
      })
      .then(response => {
        response.data.map(item => {
          const { data } = this.state
          data[`${item.attribute}_en`] = item.text
          data[`${item.attribute}_en_id`] = item.id
          this.setState({ data: data })
        })
        this.setState({ isLoading: false })
      })

    } else {
      this.setState({ isLoading: false })
    }

    // trafficSources
    api.get(`v1/traffic-sources?fields=id,name&per-page=999`)
    .then(response => this.setState({ sources: response.data }))

    // countries
    api.get(`v1/countries?fields=id,name&per-page=999`)
    .then(response => this.setState({ countries: response.data }))

    // statuses
    api.get(`v1/offers/statuses`)
    .then(response => this.setState({ statuses: response.data }))

    // categories
    api.get(`v1/categories`)
    .then(response => this.setState({ categories: response.data }))

    // advertisers
    api.get(`v1/advertisers?per-page=100`)
    .then(response => this.setState({ advertisers: response.data }))



  }

  fetchLandings = () => {
    const { id } = this.state.data
    api.get(`v1/landings`, {
      headers: {
        'x-linkable': 'enabled',
      },
      params: {
        'q[offer_id][equal]': id,
        'per-page': 999,
        'expand': 'webmaster',
      }
    })
    .then(response => {
      this.setState({ landings: response.data })
    })
  }

  fetchActions = () => {
    const { id } = this.state.data
    api.get(`v1/actions`, {
      params: {
        'q[offer_id][equal]': id,
        'per-page': 999,
      }
    })
    .then(response => {
      this.setState({ actions: response.data })
    })
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.state
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data.hasOwnProperty(name)) {
      options.initialValue = data[name]
    } else if(data && name.includes('.')) {
      const tmp = data && flatten(data) || {}
      options.initialValue = tmp[name]
    }

    if(typeof options.initialValue === 'boolean') options.valuePropName = 'checked'
    if(name == 'country_data.type' && !options.initialValue) options.initialValue = 'list'


    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { data, logo_upload_image_id, isNew } = this.state
    const { form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      // values = clean(values)

      // logo
      delete values.logo_upload_image_id
      if(logo_upload_image_id) values.logo_upload_image_id = logo_upload_image_id

      // arrays to json
      values.traffic_source_ids = JSON.stringify(values.traffic_source_ids) || '[]'
      //values.country_ids = JSON.stringify(values.country_ids) || '[]'
      values.category_ids = JSON.stringify(values.category_ids) || '[]'

      // description
      values.description = this.refs.description && this.refs.description.getEditorContents()
      values.short_description = this.refs.short_description && this.refs.short_description.getEditorContents()

      // targeting
      if(values.country_data.countries) {
        values.country_data.countries = values.country_data.countries.map(id => ({ id: id }))
      }

      if(values.country_data.except) {
        values.country_data.except = values.country_data.except.map(id => ({ id: id }))
      }

      values.country_data = JSON.stringify(values.country_data)


      // if(values.extra_trafficback) values.extra_trafficback = JSON.stringify(values.extra_trafficback)


      if(isNew) {
        api.post(`/v1/offers`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          window.location = `/offers/${response.data.id}`
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {

        // translate
        const { short_description_en_id, description_en_id } = this.state.data
        const description_en = this.refs.description_en && this.refs.description_en.getEditorContents()
        if(description_en_id) {
          api.patch(`/v1/translations/${description_en_id}`, qs.stringify({ text: description_en }))
        } else if(description_en) {
          api.post(`/v1/translations`, qs.stringify({
            text: description_en,
            model_id: data.id,
            model_class_name: 'Offer',
            attribute: 'description',
            'language': 'en'
          }))
          .then(response => {
            this.setState({ description_en_id: response.data.id })
          })
        }

        const short_description_en = this.refs.short_description_en && this.refs.short_description_en.getEditorContents()
        if(short_description_en_id) {
          api.patch(`/v1/translations/${short_description_en_id}`, qs.stringify({ text: short_description_en }))
        } else if(short_description_en) {
          api.post(`/v1/translations`, qs.stringify({
            text: short_description_en,
            model_id: data.id,
            model_class_name: 'Offer',
            attribute: 'short_description',
            'language': 'en'
          }))
          .then(response => {
            this.setState({ short_description_en_id: response.data.id })
          })
        }

        api.patch(`/v1/offers/${data.id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(`Оффер #${data.id} сохранен`)
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }

    })
  }

  _onDelete = () => {
    const { data } = this.state
    api.delete(`/v1/offers/${data.id}`)
    .then(response => {
      window.location = `/offers`
    })
  }

  _onUploadLogo = (e) => {
    const data = e.file.response
    if(!data) return
    this.setState({
      logo_upload_image_id: data.id,
      new_logo: data.server + data.patch,
    })
  }

  _onDeleteLanding = (id) => {
    api.delete(`/v1/landings/${id}`)
    .then(response => {
      window.dispatchEvent(new Event('landings.fetch'))
      message.success(`Лендинг #${id} удален`)
    })
  }

  _onDeleteAction = (id) => {
    api.delete(`/v1/actions/${id}`)
    .then(response => {
      window.dispatchEvent(new Event('actions.fetch'))
      message.success(`Действие #${id} удалена`)
    })
  }

  renderTrafficSources = () => {
    const { sources } = this.state
    return sources.map((item, i) => {
      return (
        <p key={i}><Checkbox value={item.id} key={item.id}>{item.name}</Checkbox></p>
      )
    })
  }

  render() {
    const { isLoading, iconLoading, isNew, data, actions, categories, statuses, countries, columns, landings, sources, new_logo, advertisers } = this.state
    const { currencies } = this.props.config
    const { country_data } = this.props.form.getFieldsValue()
    const _countries = countries.map(item => <Select.Option key={item.id} value={item.id} name={item.name}>{item.name}</Select.Option>)
    const _advertisers = advertisers.map(item => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)
    const values = this.props.form.getFieldsValue()
    return (
      <Form>
      <div className="content__wrapper">
        <div className="content__inner offer">

            <div className="block">
              <div className="row">
                <div className="col-md-10">
                  <div className="row">
                    <div className="col-md-6">
                      {this.validator('name', 'Название', <Input size="large" />, [{ required: true }] )}
                    </div>
                    <div className="col-md-6">
                        {this.validator('url', 'URL', <Input size="large" /> )}
                    </div>
                  </div>
                  {/* this.validator('short_description', 'Краткое описание', <Input size="large" /> ) */}

                  <div className="ant-row ant-form-item">
                    <h4>Краткое описание</h4>
                    {((!isLoading && data.hasOwnProperty('short_description')) || (!isLoading && isNew)) && <ReactQuill ref="short_description" defaultValue={data.short_description} />}
                    <br />
                    <h4>Краткое описание EN</h4>
                    {!isLoading && <ReactQuill ref="short_description_en" defaultValue={data.short_description_en} />}
                  </div>


                </div>
                <div className="col-md-2">
                  {this.validator('logo_upload_image_id', 'Логотип', (
                    <Upload
                      onChange={this._onUploadLogo}
                      name="image"
                      action={`${scheme}file-s1.${domain}/v1/uploads?access_token=${Cookies.get(cookie_prefix + '_access_token')}`}
                      showUploadList={false}
                      listType="picture-card"
                      className="avatar-uploader" >
                      {new_logo ? <img src={new_logo} /> : (data.logo ? <img src={data.logo} /> : <Icon type={'plus'} /> )}
                    </Upload>
                  ))}
                </div>
              </div>

              <div className="ant-row ant-form-item">
                <h4>Описание</h4>
                {((!isLoading && data.hasOwnProperty('description')) || (!isLoading && isNew)) && <ReactQuill ref="description" defaultValue={data.description} />}
                <br />
                <h4>Описание EN</h4>
                {!isLoading && <ReactQuill ref="description_en" defaultValue={data.description_en} />}
              </div>
            </div>


            {!isNew && (
              <Table
                className="offer__actions"
                style={{ margin: '30px 0'}}
                columns={columns.actions}
                rowKey={item => item.id}
                dataSource={actions}
                pagination={false}
                loading={isLoading}
                locale={{ emptyText: Helpers.emptyText }}
                onChange={this.handleTableChange} />
            )}

            {!isNew && (
              <Table
                className="offer__landings streams__form-landings"
                columns={columns.landings}
                rowKey={item => item.id}
                dataSource={landings}
                pagination={false}
                loading={isLoading}
                locale={{ emptyText: Helpers.emptyText }}
                onChange={this.handleTableChange} />
            )}

            {!isNew && actions.length && (
              <IndividualConditions
                offer_id={data.id}
                actions={actions}
                />
            ) || null}

            <div style={{ marginTop: '24px' }}>
              {this.validator('advertiser_info', 'Рекламодатель', <Input.TextArea size="large" rows={5} />, [] )}
            </div>

            <div className="flex" style={{ marginTop: '24px' }}>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
              </Form.Item>

              {!isNew && (
                <Form.Item>
                  <Button type="danger" htmlType="submit" size="large" style={{ marginLeft: '24px' }} onClick={this._onDelete}>Удалить</Button>
                </Form.Item>
              )}

            </div>


        </div>
        <div className="content__sidebar">
          <div className="block offer__params">

            <div className="offer__params-global">
              <h3>Параметры</h3>
              {this.validator('priority', 'Приоритет выдачи (0-100)', <Input size="large" />)}
              {this.validator('category_ids', 'Категории', <Select mode="multiple" optionFilterProp="name" size="large">{categories.map(item => <Select.Option key={item.id} value={item.id} name={item.name}>{item.name}</Select.Option>)}</Select>)}
              {this.validator('status', 'Статус', <Select size="large">{Object.keys(statuses).map(key => <Select.Option key={key} value={key}>{statuses[key]}</Select.Option>)}</Select> )}

              {values.status === 'stopped' && (
                <div>
                  <h3>Перенаправление трафика при остановке оффера</h3>
                  {this.validator('extra_trafficback.offer_id', 'ID оффера', <Input size="large" />)}
                  {this.validator('extra_trafficback.landing_id', 'ID лендинга', <Input size="large" />)}
                  <hr />
                </div>
              )}



              {this.validator('visible', 'Видимый', <Select size="large"><Select.Option key={1} value={1}>Да</Select.Option><Select.Option key={0} value={0}>Нет</Select.Option></Select> )}
              {this.validator('advertiser_id', 'Рекламодатель', <Select size="large">{_advertisers}</Select> )}
            </div>

            <div className="offer__params-sources">
              <h3>Типы трафика</h3>
              {this.validator('traffic_source_ids', '', <Checkbox.Group><div className="offer__params-sources-list">{this.renderTrafficSources()}</div></Checkbox.Group> )}
            </div>

            <div className="offer__params-targeting">
              <h3>Таргетинг</h3>
              {/* this.validator('country_ids', '', <Select mode="multiple" optionFilterProp="name" size="large">{countries.map(item => <Select.Option key={item.id} value={item.id} name={item.name}>{item.name}</Select.Option>)}</Select>) */}

              {this.validator('country_data.type', '', (
                <Select size="large">
                  <Select.Option key={0} value="list">Список стран</Select.Option>
                  <Select.Option key={1} value="all">Все страны</Select.Option>
                  <Select.Option key={2} value="all_except_cis">Все кроме СНГ</Select.Option>
                  <Select.Option key={3} value="cis">СНГ</Select.Option>
                </Select>
              ), [{ required: true }] )}

              {country_data && country_data.type == 'list' && this.validator('country_data.countries', 'Выбранные страны', <Select mode="multiple" optionFilterProp="name" size="large">{_countries}</Select>, [], 'list' )}
              {country_data && country_data.type && country_data.type !== 'list' && country_data.type !== 'all_except_cis' && this.validator('country_data.except', 'Исключение', <Select mode="multiple" optionFilterProp="name" size="large">{_countries}</Select>, [] )}



            </div>

          </div>
        </div>
      </div>


      </Form>
    )
  }
}

export default connect((state) => pick(state, 'config'))(Form.create()(Offer))


function flatten(obj) {
 var root = {};
 (function tree(obj, index){
   var suffix = toString.call(obj) == "[object Array]" ? "]" : "";
   for(var key in obj){
    if(!obj.hasOwnProperty(key))continue;
    root[index+key+suffix] = obj[key];
    if( toString.call(obj[key]) == "[object Array]" )tree(obj[key],index+key+suffix+"[");
    if( toString.call(obj[key]) == "[object Object]" )tree(obj[key],index+key+suffix+".");
   }
 })(obj,"");
 return root;
}
