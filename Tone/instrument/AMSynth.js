define(["Tone/core/Tone", "Tone/instrument/MonoSynth", "Tone/signal/Signal", "Tone/signal/Multiply", 
	"Tone/instrument/Monophonic", "Tone/signal/Expr"], 
function(Tone){

	"use strict";

	/**
	 *  @class  the AMSynth is composed of two MonoSynths where one MonoSynth is the 
	 *          carrier and the second is the modulator.
	 *
	 *  @constructor
	 *  @extends {Tone.Monophonic}
	 *  @param {Object} options the options available for the synth 
	 *                          see defaults below
	 */
	Tone.AMSynth = function(options){

		options = this.defaultArg(options, Tone.AMSynth.defaults);
		Tone.Monophonic.call(this, options);

		/**
		 *  the first voice
		 *  @type {Tone.MonoSynth}
		 */
		this.carrier = new Tone.MonoSynth(options.carrier);
		this.carrier.setVolume(-10);

		/**
		 *  the second voice
		 *  @type {Tone.MonoSynth}
		 */
		this.modulator = new Tone.MonoSynth(options.modulator);
		this.modulator.setVolume(-10);

		/**
		 *  the frequency control
		 *  @type {Tone.Signal}
		 */
		this.frequency = new Tone.Signal(440);

		/**
		 *  the ratio between the two voices
		 *  @type {Tone.Multiply}
		 *  @private
		 */
		this._harmonicity = new Tone.Multiply(options.harmonicity);

		/**
		 *  convert the -1,1 output to 0,1
		 *  @type {Tone.Expr}
		 *  @private
		 */
		this._modulationScale = new Tone.Expr("($0 + 1) * 0.5");

		/**
		 *  the node where the modulation happens
		 *  @type {GainNode}
		 *  @private
		 */
		this._modulationNode = this.context.createGain();

		//control the two voices frequency
		this.frequency.connect(this.carrier.frequency);
		this.chain(this.frequency, this._harmonicity, this.modulator.frequency);
		this.chain(this.modulator, this._modulationScale, this._modulationNode.gain);
		this.chain(this.carrier, this._modulationNode, this.output);
	};

	Tone.extend(Tone.AMSynth, Tone.Monophonic);

	/**
	 *  @static
	 *  @type {Object}
	 */
	Tone.AMSynth.defaults = {
		"harmonicity" : 3,
		"modulationIndex" : 1,
		"carrier" : {
			"volume" : -10,
			"portamento" : 0,
			"oscillator" : {
				"type" : "sine"
			},
			"envelope" : {
				"attack" : 0.01,
				"decay" : 0.01,
				"sustain" : 1,
				"release" : 0.5
			},
			"filterEnvelope" : {
				"attack" : 0.01,
				"decay" : 0.0,
				"sustain" : 1,
				"release" : 0.5,
				"min" : 20000,
				"max" : 20000
			}
		},
		"modulator" : {
			"volume" : -10,
			"portamento" : 0,
			"oscillator" : {
				"type" : "square"
			},
			"envelope" : {
				"attack" : 2,
				"decay" : 0.0,
				"sustain" : 1,
				"release" : 0.5
			},
			"filterEnvelope" : {
				"attack" : 4,
				"decay" : 0.2,
				"sustain" : 0.5,
				"release" : 0.5,
				"min" : 20,
				"max" : 1500
			}
		}
	};

	/**
	 *  trigger the attack portion of the note
	 *  
	 *  @param  {Tone.Time=} [time=now] the time the note will occur
	 *  @param {number=} velocity the velocity of the note
	 */
	Tone.AMSynth.prototype.triggerEnvelopeAttack = function(time, velocity){
		//the port glide
		time = this.toSeconds(time);
		//the envelopes
		this.carrier.envelope.triggerAttack(time, velocity);
		this.modulator.envelope.triggerAttack(time);
		this.carrier.filterEnvelope.triggerAttack(time);
		this.modulator.filterEnvelope.triggerAttack(time);
	};

	/**
	 *  trigger the release portion of the note
	 *  
	 *  @param  {Tone.Time=} [time=now] the time the note will release
	 */
	Tone.AMSynth.prototype.triggerEnvelopeRelease = function(time){
		this.carrier.triggerRelease(time);
		this.modulator.triggerRelease(time);
	};

	/**
	 *  set the ratio between the two carrier and the modulator
	 *  @param {number} ratio
	 */
	Tone.AMSynth.prototype.setHarmonicity = function(ratio){
		this._harmonicity.setValue(ratio);
	};

	/**
	 *  bulk setter
	 *  @param {Object} param 
	 */
	Tone.AMSynth.prototype.set = function(params){
		if (!this.isUndef(params.harmonicity)) this.setHarmonicity(params.harmonicity);
		if (!this.isUndef(params.carrier)) this.carrier.set(params.carrier);
		if (!this.isUndef(params.modulator)) this.modulator.set(params.modulator);
		Tone.Monophonic.prototype.set.call(this, params);
	};

	/**
	 *  clean up
	 */
	Tone.AMSynth.prototype.dispose = function(){
		Tone.Monophonic.prototype.dispose.call(this);
		this.carrier.dispose();
		this.modulator.dispose();
		this.frequency.dispose();
		this._modulationIndex.dispose();
		this._harmonicity.dispose();
		this._modulationScale.disconnect();
		this.carrier = null;
		this.modulator = null;
		this.frequency = null;
		this._modulationIndex = null;
		this._harmonicity = null;
		this._modulationScale = null;
	};

	return Tone.AMSynth;
});