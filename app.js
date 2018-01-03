const request = require('request-promise');
const cheerio = require('cheerio')
const client = require('./es.js');


async function doStuff() {
    try {
        del = await client.indices.delete({ index: 'seinfeld' });
        create = await
            client.indices.create({
                index: 'seinfeld'
            });
        for (var ep_num = 1; ep_num <= 176; ep_num++) {
            ep_char = ep_num.toString();
            if (ep_num < 10) ep_char = "0" + ep_char
            console.log("Episode " + ep_char)
            let response = await request("http://www.seinology.com/scripts/script-" + ep_char + ".shtml");
            let $ = cheerio.load(response, {
                decodeEntities: false
            });
            var script_text = $(".spacer2").find("font").html()
            script_text = script_text.replace(/<br>/g, "")
            script_text = script_text.replace("(The series is titled The Seinfeld Chronicles, then re-titled Seinfeld for the rest of the series)", "")
            script_text = script_text.replace(/\n\s+\n/g, "\n")
            script_text = script_text.replace(/^\s+/gm, "")
            script_array = script_text.split(/\={5,}/)
            script_intro = script_array[0].split(/\n/)
            episode = {
                title: script_intro[0].split(/\s?\-\s?/)[1],
                pc: +script_intro[1].split(/\,\s/)[0].split(/\:\s/)[1],
                season: +script_intro[1].split(/\,\s/)[1].split(" ")[1],
                season_episode: +script_intro[1].split(/\,\s/)[2].split(" ")[1],
                broadcast_date_str: script_intro[2].split(/\:\s?/)[1],
                broadcast_date: Date.parse(script_intro[2].split(/\:\s?/)[1]),
                written_by: script_intro[3].split(/By\s/)[1].split(/\s\&\s/),
                directed_by: script_intro[4].split(/By\s/)[1].split(/\s\&\s/),
                cast: []
            }
            for (i = 5; i < script_intro.length; i++) {
                cast_info = script_intro[i].split(/\s\.+\s/)
                if (cast_info.length == 2) {
                    cast_member = {
                        actor: cast_info[0],
                        character: cast_info[1]
                    }
                    episode.cast.push(cast_member);
                }
            }

            let es_resp = await client.index({
                index: 'seinfeld',
                type: 'line',
                body: episode
            });
            //console.log(episode)
            //console.log(script_array[1])
            script_lines = script_array[1].split(/\n/)
            for (i = 0; i < script_lines.length; i++) {
                line_info = script_lines[i].split(/\:\s/)
                if (line_info.length == 2) {
                    //dialogue
                    //console.log(line_info[0])
                    char = line_info[0].split("(")

                    line = {
                        name: char[0],
                        text: line_info[1]
                    }
                    if (char[1]) line.direction = char[1].replace(")", "")
                    match = episode.cast.find(function (e) { return e.character.toLowerCase().indexOf(line.name.toLowerCase()) == 0 })
                    if (match) line.actor = match.actor
                    else line.actor = "UNKNOWN"
                    line.season = episode.season
                    line.season_episode = episode.season_episode
                    let es_resp = await client.index({
                        index: 'seinfeld',
                        type: 'line',
                        body: line
                    });
                    //console.log(match)
                    //console.log(line)
                }
                else {
                    //console.log(script_lines[i])
                }

            }
        }

        // handle the HTTP response
    } catch (error) {
        // handle error
        console.log(error)
    }
}



doStuff();

