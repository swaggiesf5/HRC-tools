# Reflection — 2026-07-15

Today was about getting HRC to run our simulations by itself, and along the way I
found and fixed a data problem that would have quietly ruined every solve.

We are running these sims in-house rather than paying for HRC Cloud, which means we
have to reproduce what the cloud would have done for us: feed HRC hundreds of hand
configurations, one after another, and let it solve each one. HRC is a desktop
application with no command-line mode — there is no way to hand it a folder of
files and walk away. The only way in is through its window: opening each file,
clicking Next through the setup pages, loading the betting script, and starting the
calculation. So the automation has to *drive the GUI* the way a person would. On
Windows the tool for that is AutoHotkey, so I started by bringing back our old
AutoHotkey script and rebuilding it around a single spot — the 1500-player, 75%
stage — as the test case.

The reason we can't skip the GUI entirely is the betting script. Everything else
about a hand — the stacks, the blinds, the payouts, the field size — lives inside
the JSON file and HRC reads it on import. The one thing it will *not* read from the
file is the `.js` betting script; that has to be loaded by hand through the script
editor in the window. That single limitation is what forces us to automate the GUI
at all, rather than just batch-feeding files.

Before automating, I wanted to be sure HRC was actually reading our files correctly,
because we'd had a scare earlier where a 1500-player tournament showed only 673
players. Watching it live today, the MTT Stacks page came up showing exactly 1125
players and 15,000,000 chips, with a natural spread of stack sizes across the field.
So that problem is genuinely solved — HRC reads the "other tables" from our JSON,
and the earlier 673 was just a stale file left over from an old import. Nothing to
fix there.

The real issue surfaced one page later. HRC breaks each betting round into
"buckets" — how finely it models the possible hands — and the setup screen was
showing 16,384 buckets on the flop, turn, and river. That is enormously more detail
than we want; it makes each solve far heavier and was almost certainly part of why
the calculation was crashing my machine on memory. The values should have been 1024
on the flop and 256 on the turn and river. I traced where the wrong numbers came
from: our hand files are produced by a Python generator in my boss's repository, and
that generator copies its engine settings verbatim from a template file,
`example.json` — and the template had the 16,384 values baked in. So every file it
had ever produced inherited them. I fixed it at the source: corrected the template,
regenerated all 4,092 configs, confirmed the new files carry the right buckets, and
pushed the fix up to my boss's repository so anyone who regenerates from now on gets
correct files. Then I swapped the corrected files into our working folder. A nice
side effect is that the automation no longer has to touch those settings at all —
HRC now reads the right values straight from the file.

I also solved the hardest part of unattended running: knowing when to wait. A solve
can take anywhere from seconds to many minutes, and we can't just guess a fixed
delay. But HRC shows a progress window while it works — the same one for both the
initial hand setup and the Nash calculation. So instead of waiting a set time or
asking a human to click when it's done, the script now watches for that progress
window to close and continues the instant it does. That is what lets the whole
sequence run start-to-finish with nobody watching.

The last thing I ran into is the one to pick up tomorrow. Our production instance
runs Amazon Linux, and AutoHotkey only exists on Windows — it cannot run there at
all. So the AutoHotkey version is only ever a Windows debugging aid; the real
production tool has to be different. The Linux equivalent is a utility called
xdotool, which does the same job — activating the window, sending keystrokes,
waiting for windows to appear and close. I ported the entire script over to it, so
we now have a Linux version ready to test on the instance itself, where the memory
is large enough to actually run the solves.

Tomorrow: install xdotool on the instance, fill in the instance's real file paths,
confirm a couple of the window titles it needs to watch for, and run it end-to-end
on one spot. Once that one spot works cleanly, cloning it out to all 37 spots is
straightforward.
