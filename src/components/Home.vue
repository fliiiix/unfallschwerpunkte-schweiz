<template>
  <div>
    <h2>Hoii</h2>
    <svg> 
      <circle class="target" style="fill: #69b3a2" stroke="black" cx=50 cy=50 r=40></circle>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: 'Home',
  mounted() {
    d3.select(".target").style("fill", "black");
  }
}
</script>