import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import replace from 'replace';
import colors from 'colors';
import concat from 'concat-files';
import glob from 'glob-all';
import del from 'del';
import open from 'open';
import readm from 'read-multiple-files';
import fse from 'fs-extra';
import task from './lib/task';
import copy from './lib/copy';
import watch from './lib/watch';
import cfs from './lib/fs';

const luaOutputPath = 'build/ox.lua';
const reloadPort = 3000;
const vocationsMap = {
  '(MS)': 'Sorcerer',
  '(ED)': 'Druid',
  '(EK)': 'Knight',
  '(RP)': 'Paladin'
};

let vocationTags = Object.keys(vocationsMap);

function buildFile(spawnName, luaOutputData) {
  // Generate sync script
  let timestamp = Date.now();
  let homePath = cfs.getUserHome();
  let reloadScript = `
    do
      local pub = IpcPublisherSocket.New("pub", ${reloadPort+1})
      local sub = IpcSubscriberSocket.New("sub", ${reloadPort})
      sub:AddTopic("live-reload")
      while (true) do
          local message, topic, data = sub:Recv()
          if message then
            print('Reloading library...')
            loadSettings("${spawnName}", "Scripter")
            pub:PublishMessage("live-reload", Self.Name());
          end
          wait(200)
      end
    end`;

  // Load spawn XBST
  fs.readFile(`./waypoints/${spawnName}.xbst`, function (err, xbstData) {
    if (err) throw err;

    // Detect town from waypoints
    xbstData = xbstData.toString('utf8');
    let townMatches = xbstData.match(/text="(.+)\|.+~spawn/);
    let townName = townMatches ? townMatches[1] : undefined;

    // Unable to detect town
    if (!townName) {
      console.log(colors.red.underline('Failed to detect town from spawn. Check XBST.'));
      return;
    }

    // Load spawn config
    fs.readFile(`./configs/${spawnName}.ini`, function (err, configData) {
      if (err) throw err;

      // Determine vocation from spawnName
      let vocationName = 'unknown';
      for (var i = 0; i < vocationTags.length; i++) {
        let tag = vocationTags[i];
        if (spawnName.indexOf(tag) !== -1) {
          vocationName = vocationsMap[tag];
          break;
        }
      }

      // Replace tokens
      let data = luaOutputData.toString('utf8');
      data = data.replace('{{VERSION}}', 'local');
      data = data.replace('{{SCRIPT_TOWN}}', townName);
      data = data.replace('{{SCRIPT_NAME}}', spawnName);
      data = data.replace('{{SCRIPT_VOCATION}}', vocationName);

      // Insert config
      data = data.replace('{{CONFIG}}', configData.toString('utf8'));

      // Base 64 encode lua
      let encodedLua = new Buffer(data).toString('base64');
      let encodedReload = new Buffer(reloadScript).toString('base64');
      let combinedWaypoints;
      
      // Write to XBST
      let scripterPanelXML = `
        <panel name="Scripter">
          <control name="RunningScriptList">
          <script name=".ox.${timestamp}.lua"><![CDATA[${encodedLua}]]></script>
          <script name=".sync.${timestamp}.lua"><![CDATA[${encodedReload}]]></script>
          </control>
        </panel>`;

      // Get all the town waypoints
      var townPaths = glob.sync('./waypoints/towns/*.json'),
        townWaypoints = [];

      readm(townPaths, (err, towns) => {
        if (err) {
          throw err;
        }

        // Iterate through towns
        towns.forEach((waypoints) => {
          let townData = JSON.parse(waypoints);
          // Iterate through waypoints in each town
          townData.forEach((item) => {
            // Add waypoint string to array
            townWaypoints.push(`\n\t\t<item text="${item.label}" tag="${item.tag}"/>`);
          });
        });

        // Combine waypoints
        townWaypoints.push('\n');
        combinedWaypoints = townWaypoints.join('');

        // Combine spawn file with town waypoints
        let insertPoint = '<control name="WaypointList">\r\n';
        let xbstCombinedData = xbstData.toString('utf8');
        xbstCombinedData = xbstCombinedData.replace(insertPoint, insertPoint + combinedWaypoints);
        
        // Combine spawn file with other xml data
        xbstCombinedData += '\n' + scripterPanelXML;

        // Save XBST
        let scriptpath = `${homePath}/Documents/XenoBot/Settings/${spawnName}.xbst`;
        fs.writeFile(scriptpath, xbstCombinedData, function (err) {

          // Success message
          console.log(colors.green(`Successfully built ${spawnName}.`), scriptpath);

        });
      });
    });
  });
}

/**
 * Concatenate and modify the final build script
 */
export default task('bundle', async () => {
  // Clean build folder
  await require('./clean')();

  // Combine all lua together
  await concat(glob.sync('./src/*.lua'), luaOutputPath, function() {

    // Lint source
    let lint;
    try {
      // TODO: check for luac depedency
      lint = child_process.execSync('luac -p ' + luaOutputPath, {
        timeout: 3000,
        encoding: 'utf8'
      });
    } catch (e) {
      console.log(colors.red.underline('Linting failed or luac depedency is missing.'), e.stderr);
    }

    // Spawn name provided from CLI
    const spawnName = process.env.npm_config_script;

    // Modify concatenated library
    fs.readFile(luaOutputPath, (err, luaOutputData) => {

      // Read error
      if (err) throw err;

      // Build single file if spawn defined, all files otherwise
      if (spawnName) {
        buildFile(spawnName, luaOutputData);
      } else {
        const spawnFiles = glob.sync('./waypoints/*.xbst');
        spawnFiles.forEach((spawnPath) => {
          buildFile(path.basename(spawnPath, '.xbst'), luaOutputData);
        })
      }
    });
  });
});
