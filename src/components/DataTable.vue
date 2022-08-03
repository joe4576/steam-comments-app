<template>
  <div>
    <v-skeleton-loader
      v-if="useLoader && loading"
      type="table-thead, table-tbody"
    />
    <v-container>
      <v-data-table
        v-if="!loading && items.length"
        v-bind="$attrs"
        class="data-table"
        :headers="headers"
        :items="items"
      >
        <template
          v-for="header in headers"
          #[`item.${header.value}`]="{ item }"
        >
          <slot :name="header.value" :item="item">
            {{ item[header.value] }}
          </slot>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "@vue/composition-api";
import { DataTableHeader } from "vuetify";

export interface TypedDataTableHeader<T extends object>
  extends DataTableHeader {
  value: Extract<keyof T, string>;
}

export default defineComponent({
  name: "DataTable",
  inheritAttrs: false,
  props: {
    items: {
      type: Array as PropType<any[]>,
      required: false,
      default: () => [],
    },
    headers: {
      type: Array as PropType<TypedDataTableHeader<any>[]>,
      required: false,
      default: () => [],
    },
    useLoader: {
      type: Boolean,
      required: false,
      default: true,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
});
</script>

<style>
/* Ensures that column widths specified in table
headers are honoured.

https://github.com/vuetifyjs/vuetify/issues/5072
*/
.data-table table {
  table-layout: fixed;
}
</style>
