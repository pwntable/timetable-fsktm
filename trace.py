import parser

original = parser._deploy_targets

def mock_deploy(*args, **kwargs):
    targets = args[0]
    for t in targets:
        if t.get("code") == "BIC31903":
            print(f"DEPLOYING: {t['section']} at {args[1]},{args[2]} Dur:{args[3]} from {targets}")
    original(*args, **kwargs)

parser._deploy_targets = mock_deploy
parser.extract_footnotes()
parser.extract_grid()
