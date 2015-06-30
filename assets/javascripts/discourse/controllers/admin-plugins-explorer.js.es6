import showModal from 'discourse/lib/show-modal';
import Query from 'discourse/plugins/discourse-data-explorer/discourse/models/query';
import { popupAjaxError } from 'discourse/lib/ajax-error';

export default Ember.ArrayController.extend({
  selectedQueryId: null,
  results: null,
  dirty: false,
  loading: false,

  explain: false,

  saveDisabled: Ember.computed.not('selectedItem.dirty'),
  runDisabled: Ember.computed.alias('selectedItem.dirty'),

  selectedItem: function() {
    const _id = this.get('selectedQueryId');
    const id = parseInt(_id);
    return this.get('content').find(function(q) {
      return q.get('id') === id;
    });
  }.property('selectedQueryId'),

  addCreatedRecord(record) {
    this.pushObject(record);
    this.set('selectedQueryId', Ember.get(record, 'id'));
    this.get('selectedItem').set('dirty', false);
    this.set('results', null);
  },

  actions: {
    dummy() {},

    importQuery() {
      showModal('import-query');
      this.set('showCreate', false);
    },

    showCreate() {
      this.set('showCreate', true);
    },

    editName() {
      this.set('editName', true);
    },

    download() {
      window.open(this.get('selectedItem.downloadUrl'), "_blank");
    },

    create() {
      const self = this;
      this.set('loading', true);
      this.set('showCreate', false);
      var newQuery = this.store.createRecord('query', {name: this.get('newQueryName')});
      newQuery.save().then(function(result) {
        self.addCreatedRecord(result.target);
      }).catch(popupAjaxError).finally(function() {
        self.set('loading', false);
      });
    },

    save() {
      const self = this;
      this.set('loading', true);
      this.get('selectedItem').save().then(function() {
        const query = self.get('selectedItem');
        query.markNotDirty();
        self.set('editName', false);
      }).catch(popupAjaxError).finally(function() {
        self.set('loading', false);
      });
    },

    discard() {
      const self = this;
      this.set('loading', true);
      this.store.find('query', this.get('selectedItem.id')).then(function(result) {
        const query = self.get('selectedItem');
        query.setProperties(result.getProperties(Query.updatePropertyNames));
        query.markNotDirty();
        self.set('editName', false);
        self.set('results', null);
      }).catch(popupAjaxError).finally(function() {
        self.set('loading', false);
      });
    },

    destroy() {
      const self = this;
      const query = this.get('selectedItem');
      this.set('loading', true);
      this.store.destroyRecord('query', query).then(function() {
        query.set('destroyed', true);
      }).catch(popupAjaxError).finally(function() {
        self.set('loading', false);
      });
    },

    recover() {
      const self = this;
      const query = this.get('selectedItem');
      this.set('loading', true);
      query.save().then(function() {
        query.set('destroyed', false);
      }).catch(popupAjaxError).finally(function() {
        self.set('loading', false);
      });
    },

    run() {
      if (this.get('selectedItem.dirty')) {
        self.set('results', {errors: [I18n.t('errors.explorer.dirty')]});
        return;
      }
      const self = this;
      this.set('loading', true);
      Discourse.ajax("/admin/plugins/explorer/queries/" + this.get('selectedItem.id') + "/run", {
        type: "POST",
        data: {
          params: JSON.stringify({foo: 34}),
          explain: true
        }
      }).then(function(result) {
        console.log(result);
        self.set('results', result);
      }).catch(popupAjaxError).finally(function() {
        self.set('loading', false);
      });
    }
  }
});