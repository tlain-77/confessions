"""Voice denoising with DeepFilterNet3 (runs in models/dfvenv). usage: denoise.py in.wav out.wav [atten_lim_db]"""
import sys, glob, os
from df.enhance import enhance, init_df, load_audio, save_audio
base = [d for d in glob.glob('models/DeepFilterNet3/**/config.ini', recursive=True)]
model, st, _ = init_df(model_base_dir=os.path.dirname(base[0]), post_filter=False, log_level='ERROR')
lim = float(sys.argv[3]) if len(sys.argv) > 3 else None
audio, _ = load_audio(sys.argv[1], sr=st.sr())
out = enhance(model, st, audio, atten_lim_db=lim)
save_audio(sys.argv[2], out, st.sr())
print('denoised', sys.argv[1], '->', sys.argv[2], 'limit', lim)
