

function _data(FileAttachment){return(
FileAttachment("FoodAccessResearchAtlasDataA.csv").csv()
)}

function _parsedData(data){return(
data.map(row => ({
  State: row.State,
  County: row.County,
  Urban: +row.Urban,
  Pop2010: +row.Pop2010 || 0,
  PovertyRate: +row.PovertyRate || 0,
  LILATracts_halfAnd10: +row.LILATracts_halfAnd10 || 0,
  TractSNAP: +row.TractSNAP || 0
}))
)}

function _4(parsedData){return(
parsedData.slice(0, 10)
)}

function _userLocation()
{
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve(position.coords),
      error => reject(error)
    );
  });
}


async function _stateFromLocation(userLocation)
{
  const coords = await userLocation;
  const apiKey = "29d7898805f745f6843d52b5e9308174"; // Replace with your OpenCage API key
  const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${coords.latitude}+${coords.longitude}&key=${apiKey}`);
  const data = await response.json();

  // Extract state from the geocoding result
  const state = data.results[0]?.components?.state || "Unknown";
  return state;
}


function _jitter(){return(
function jitter(value, amount = 0.1) {
  return value + (Math.random() - 0.5) * amount;
}
)}

function _filteredData(parsedData,stateSelect,areaFilter)
{
  const baseData = parsedData.filter(d => d.State === stateSelect);
  return areaFilter === "All" ? baseData :
         areaFilter === "Urban" ? baseData.filter(d => d.Urban === 1) :
         baseData.filter(d => d.Urban === 0);
}


function _areaFilter(Inputs){return(
Inputs.select(
  ["All", "Urban", "Rural"],
  {
    label: "Area Type",
    value: "All"
  }
)
)}

async function _stateSelect(stateFromLocation,Inputs,parsedData)
{
  const state = await stateFromLocation;
  return Inputs.select(
    Array.from(new Set(parsedData.map(d => d.State))).sort(),
    {
      label: "Select State",
      value: state !== "Unknown" ? state : "California"
    }
  )
}

function _title(html) {
  return html`
    <div style="font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Accessibility vs. SNAP Participation</h1>
      <p style="font-size: 14px; color: #666; margin-top: 0;">
        Filter and explore data showing the relationship between low food access and SNAP participation.
      </p>
    </div>
  `
}

function _11(d3,parsedData,stateSelect,areaFilter,filteredData,jitter)
{
  // Set dimensions
  const width = 1400
  const height = 600
  const margin = {top: 40, right: 100, bottom: 60, left: 100}
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom



   // Create header container
  const headerHeight = 120;
  const totalHeight = height + headerHeight;

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", totalHeight)
    .attr("viewBox", [0, 0, width, totalHeight])
    .attr("style", "max-width: 100%; height: auto;");
  

  // // Add title and subtitle with normal style
  // svg.append("text")
  //   .attr("x", margin.left)
  //   .attr("y", 30)
  //   .attr("font-size", "24px")
  //   .attr("font-weight", "bold")
  //   .style("font-family", "-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif")
  //   .text("Accessibility vs. SNAP Participation");

  // svg.append("text")
  //   .attr("x", margin.left)
  //   .attr("y", 50)
  //   .attr("font-size", "14px")
  //   .attr("fill", "#666")
  //   .style("font-family", "-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif")
  //   .text("Filter and explore data showing the relationship between low food access and SNAP participation.");

  
  
  // Create scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => d.PovertyRate)])
    .range([0, innerWidth])
    .nice()
  
  
  const yScale = d3.scaleLinear()
  .domain([0, 1])  // Binary domain
  .range([height - margin.bottom - 150, margin.top + 70])  // More space for jitter

  
  // function jitter(value) {
  //   return value === 0 ? 
  //     yScale(0) + (Math.random() - 0.5) * 20 : // More spread for 0s
  //     yScale(1) + (Math.random() - 0.5) * 20;  // More spread for 1s
  // }
  // Population scale for bubble size
  const radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(filteredData, d => d.Pop2010)])
    .range([3, 25])

  // Color scale for SNAP participation
  const colorScale = d3.scaleSequential()
    .domain([0, d3.max(filteredData, d => d.TractSNAP)])
    .interpolator(d3.interpolateBlues)

 
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top + headerHeight})`);

  // Add axes
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .call(g => g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 40)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .text("Poverty Rate (%)"))

  // Add bubbles
  const bubbles = g.selectAll("circle")
    .data(filteredData)
    .join("circle")
    .attr("cx", d => xScale(d.PovertyRate))
    .attr("cy", d => yScale(jitter(d.LILATracts_halfAnd10, 0.2)))
    .attr("r", d => radiusScale(d.Pop2010))
    .attr("fill", d => colorScale(d.TractSNAP))
    .attr("opacity", 0.7)
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)

  // Add tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("border", "1px solid #ddd")
    .style("padding", "10px")
    .style("border-radius", "3px")

  bubbles
    .on("mouseover", function(event, d) {
      d3.select(this)
        .attr("stroke-width", 2)
        .attr("opacity", 1)
      
      tooltip
        .style("visibility", "visible")
        .html(`
          County: ${d.County}<br/>
          Poverty Rate: ${d.PovertyRate.toFixed(1)}%<br/>
          Population: ${d3.format(",")(d.Pop2010)}<br/>
          SNAP Participants: ${d3.format(",")(d.TractSNAP)}<br/>
          ${d.Urban ? 'Urban' : 'Rural'} Area<br/>
          ${d.LILATracts_halfAnd10 ? 'Food Desert' : 'Not a Food Desert'}
        `)
    })
    .on("mousemove", function(event) {
      tooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px")
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.7)
      tooltip.style("visibility", "hidden")
    })

  // Add legend for bubble size
  const legendSize = svg.append("g")
    .attr("transform", `translate(${width - margin.right- 10}, ${margin.top})`)

  const legendSizes = [1000, 5000, 10000]
  legendSize.selectAll("circle")
    .data(legendSizes)
    .join("circle")
    .attr("cy", (d, i) => i * 40)
    .attr("r", d => radiusScale(d))
    .attr("fill", "none")
    .attr("stroke", "black")

  legendSize.selectAll("text")
    .data(legendSizes)
    .join("text")
    .attr("x", 30)
    .attr("y", (d, i) => i * 40 + 5)
    .text(d => d3.format(",")(d))
    .attr("font-size", "10px")

  legendSize.append("text")
    .attr("x", -35)
    .attr("y", -15)
    .text("Population")
    .attr("font-weight", "bold")
    .attr("font-size", "10px")

  // Add color legend
  const colorLegend = svg.append("g")
    .attr("transform", `translate(${width - margin.right- 10}, ${margin.top + 150})`);
  
  // Create gradient for legend
  const gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "snap-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  
  gradient.selectAll("stop")
    .data([
      {offset: "0%", color: colorScale(d3.max(filteredData, d => d.TractSNAP))},
      {offset: "100%", color: colorScale(d3.min(filteredData, d => d.TractSNAP))}
    ])
    .join("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);
  
  // Add gradient rectangle
  colorLegend.append("rect")
    .attr("width", 20)
    .attr("height", 100)
    .style("fill", "url(#snap-gradient)");
  
  // Add legend labels
  colorLegend.append("text")
    .attr("x", -20)
    .attr("y", -10)
    .text(`SNAP Participation (${d3.max(filteredData, d => d.TractSNAP)})`)
    .attr("font-weight", "bold")
    .attr("font-size", "10px");
  
  colorLegend.append("text")
    .attr("x", 5)
    .attr("y", 120)
    .text(`(${d3.min(filteredData, d => d.TractSNAP)})`)
    .attr("font-size", "11px");

  g.append("g")
    .call(d3.axisLeft(yScale)
      .tickValues([0, 1])
      .tickFormat(d => d === 0 ? "Not a Food Desert" : "Food Desert"))
    .call(g => g.select(".domain").remove()) // Remove axis line
    .call(g => g.selectAll(".tick line").remove()); // Remove tick lines


    // Add click interaction and highlight
  let selectedCircle = null;
  
  const detailPanel = d3.select("body").append("div")
    .attr("class", "detail-panel")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("padding", "10px")
    .style("border", "1px solid #ddd")
    .style("border-radius", "8px")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");
  
  bubbles
    .on("click", function(event, d) {
      // Reset previous selection
      if (selectedCircle) {
        selectedCircle.attr("stroke-width", 0.5)
          .attr("stroke", d => d.Urban ? "#2c3e50" : "#c0392b");
      }
      
      // Handle new selection
      if (selectedCircle === this) {
        selectedCircle = null;
        detailPanel.style("visibility", "hidden");
      } else {
        selectedCircle = d3.select(this);
        selectedCircle
          .attr("stroke-width", 3)
          .attr("stroke", "#000");
        
        // Update and show detail panel
        detailPanel
          .style("visibility", "visible")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px")
          .html(`
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
              ${d.County}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #666;">Population:</span> ${d3.format(",")(d.Pop2010)}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #666;">Poverty Rate:</span> ${d.PovertyRate.toFixed(1)}%
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #666;">SNAP Participants:</span> ${d3.format(",")(d.TractSNAP)}
            </div>
            <div>
              <span style="color: #666;">Area Type:</span> ${d.Urban ? "Urban" : "Rural"}
            </div>
          `);
      }
    });
  
  // Add click-away listener
  d3.select("body").on("click", function(event) {
    if (event.target.tagName !== "circle" && selectedCircle) {
      selectedCircle.attr("stroke-width", 0.5)
        .attr("stroke", d => d.Urban ? "#2c3e50" : "#c0392b");
      selectedCircle = null;
      detailPanel.style("visibility", "hidden");
    }
  });


  // Update title to reflect current selections
  const title = svg.append("text")
    .attr("x", width / 2)
    .attr("y", headerHeight + margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(`${stateSelect} - ${areaFilter === "All" ? "All Areas" : areaFilter}`);

  
  return svg.node()
}


function _style(html){return(
html`
<style>
.tooltip {
  font-family: -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
}
</style>
`
)}

// export default function define(runtime, observer) {
//   const main = runtime.module();
//   function toString() { return this.url; }
//   const fileAttachments = new Map([
//     ["FoodAccessResearchAtlasDataA.csv", {url: new URL("./FoodAccessResearchAtlasDataA.csv", import.meta.url)}]
//   ]);
//   main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
//   main.variable(observer()).define(["md"], _1);
//   main.variable(observer("data")).define("data", ["FileAttachment"], _data);
//   main.variable(observer("parsedData")).define("parsedData", ["data"], _parsedData);
//   main.variable(observer()).define(["parsedData"], _4);
//   main.variable(observer("userLocation")).define("userLocation", _userLocation);
//   main.variable(observer("stateFromLocation")).define("stateFromLocation", ["userLocation"], _stateFromLocation);
//   main.variable(observer("jitter")).define("jitter", _jitter);
//   main.variable(observer("filteredData")).define("filteredData", ["parsedData","stateSelect","areaFilter"], _filteredData);
//   main.variable(observer()).define(["html"], _title);
//   main.variable(observer("viewof areaFilter")).define("viewof areaFilter", ["Inputs"], _areaFilter);
//   main.variable(observer("areaFilter")).define("areaFilter", ["Generators", "viewof areaFilter"], (G, _) => G.input(_));
//   main.variable(observer("viewof stateSelect")).define("viewof stateSelect", ["stateFromLocation","Inputs","parsedData"], _stateSelect);
//   main.variable(observer("stateSelect")).define("stateSelect", ["Generators", "viewof stateSelect"], (G, _) => G.input(_));
//   main.variable(observer()).define(["d3","parsedData","stateSelect","areaFilter","filteredData","jitter"], _11);
//   main.variable(observer("style")).define("style", ["html"], _style);
//   return main;
// }

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["FoodAccessResearchAtlasDataA.csv", {url: new URL("./FoodAccessResearchAtlasDataA.csv", import.meta.url)}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  
  // Hide implementation details by using empty observers
  // main.variable(() => {}).define(["md"], _1);
  main.variable(() => {}).define("data", ["FileAttachment"], _data);
  main.variable(() => {}).define("parsedData", ["data"], _parsedData);
  main.variable(() => {}).define(["parsedData"], _4);
  main.variable(() => {}).define("userLocation", _userLocation);
  main.variable(() => {}).define("stateFromLocation", ["userLocation"], _stateFromLocation);
  main.variable(() => {}).define("jitter", _jitter);
  main.variable(() => {}).define("filteredData", ["parsedData","stateSelect","areaFilter"], _filteredData);
  
  // Keep the visible UI elements
  // main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof areaFilter")).define("viewof areaFilter", ["Inputs"], _areaFilter);
  main.variable(observer("areaFilter")).define("areaFilter", ["Generators", "viewof areaFilter"], (G, _) => G.input(_));
  main.variable(observer("viewof stateSelect")).define("viewof stateSelect", ["stateFromLocation","Inputs","parsedData"], _stateSelect);
  main.variable(observer("stateSelect")).define("stateSelect", ["Generators", "viewof stateSelect"], (G, _) => G.input(_));
  main.variable(observer()).define(["d3","parsedData","stateSelect","areaFilter","filteredData","jitter"], _11);
  main.variable(observer("style")).define("style", ["html"], _style);
  return main;
}