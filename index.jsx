import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

const getVoices = () => {
	return new Promise(resolve => {
		let voices = speechSynthesis.getVoices();

		if (voices.length) {
			resolve(voices);
			return;
		}

		const voiceschanged = () => {
			resolve(speechSynthesis.getVoices());
		};

		speechSynthesis.onvoiceschanged = voiceschanged;
	});
};

const formatVoiceData = voices => {
	return voices.map(voice => ({
		name: voice.name,
		language: voice.lang,
		local: voice.localService
	}));
};

const groupByLanguage = voices => {
	const grouped = {};
	voices.forEach(voice => {
		const lang = voice.language;
		if (!grouped[lang]) {
			grouped[lang] = [];
		}
		grouped[lang].push(voice);
	});
	return grouped;
};

function VoiceInspector() {
	const [voices, setVoices] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getVoices().then(voiceList => {
			setVoices(formatVoiceData(voiceList));
			setLoading(false);
		});
	}, []);

	const downloadJson = useCallback(() => {
		const dataStr =
			'data:text/json;charset=utf-8,' +
			encodeURIComponent(JSON.stringify(voices, null, 2));
		const link = document.createElement('a');
		link.setAttribute('href', dataStr);
		link.setAttribute('download', 'browser-voices.json');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [voices]);

	if (loading) {
		return <div className="intro-msg">Loading voices...</div>;
	}

	if (voices.length === 0) {
		return (
			<div className="intro-msg">
				<h2>No voices available</h2>
				<p>
					Your browser does not have any speech synthesis voices
					installed, or the Web Speech API is not supported.
				</p>
			</div>
		);
	}

	const grouped = groupByLanguage(voices);
	const sortedLanguages = Object.keys(grouped).sort();
	const localCount = voices.filter(v => v.local).length;
	const remoteCount = voices.length - localCount;

	return (
		<div>
			<div className="voice-section">
				<h2>
					Summary
					<span className="anno">
						{voices.length} voice(s) available
					</span>
				</h2>
				<p>
					<strong>{localCount}</strong> local voice(s),{' '}
					<strong>{remoteCount}</strong> remote voice(s) across{' '}
					<strong>{sortedLanguages.length}</strong> language(s).
				</p>
				<button type="button" onClick={downloadJson}>
					Download as JSON
				</button>
			</div>

			<div className="voice-section">
				<h2>
					All Voices
					<span className="anno">grouped by language</span>
				</h2>

				{sortedLanguages.map(lang => (
					<div key={lang} style={{ marginBottom: '1.5em' }}>
						<h3>
							<code>{lang}</code>
							<span className="anno">
								{grouped[lang].length} voice(s)
							</span>
						</h3>
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Local</th>
								</tr>
							</thead>
							<tbody>
								{grouped[lang].map((voice, idx) => (
									<tr key={idx}>
										<td>
											<code>{voice.name}</code>
										</td>
										<td>
											<code>
												{voice.local ? 'Yes' : 'No'}
											</code>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				))}
			</div>
		</div>
	);
}

const app_el = document.getElementById('app');

ReactDOM.render(<VoiceInspector />, app_el);
